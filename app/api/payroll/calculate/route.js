import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculatePayrollForEmployee } from '@/lib/payroll-calculator'
import { logError, handleApiError } from '@/lib/error-handler'

export async function POST(request) {
  try {
    // Check permissions (HR or Admin only)
    await requireRole(['admin', 'hr'])
    
    const { month } = await request.json()
    
    if (!month) {
      return NextResponse.json({ error: 'يرجى اختيار الشهر' }, { status: 400 })
    }
    
    const [year, monthNum] = month.split('-')
    const monthStart = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
    const monthEnd = new Date(parseInt(year), parseInt(monthNum), 0)
    const terminationMonthEnd = `${month}-31` // For comparison
    
    // Build efficient where clause for employees who worked during this month
    // بناء where clause فعال للموظفين الذين عملوا خلال هذا الشهر
    const employeeWhere = {
      OR: [
        // Employees hired before or during this month
        { hireDate: { lte: monthEnd } },
        { hireDate: null }
      ],
      AND: [
        // Exclude employees terminated before this month
        {
          OR: [
            { status: { not: 'terminated' } },
            { terminationDate: null },
            {
              AND: [
                { status: 'terminated' },
                {
                  OR: [
                    // Termination date is in this month or after
                    { terminationDate: { gte: monthStart } }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
    
    // Get employees who worked during this month (optimized query)
    // جلب الموظفين الذين عملوا خلال هذا الشهر (query محسّن)
    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      select: {
        id: true,
        name: true,
        employeeNumber: true,
        salary: true,
        workHours: true,
        hireDate: true,
        status: true,
        terminationDate: true,
        suspensionDate: true,
        suspensionType: true
      }
    })
    
    // Filter employees in memory (more efficient than complex DB query)
    // تصفية الموظفين في الذاكرة (أكثر فعالية من query معقد)
    const filteredEmployees = employees.filter(emp => {
      // Check if employee was hired before or during this month
      if (emp.hireDate) {
        const hireDate = new Date(emp.hireDate)
        if (hireDate > monthEnd) {
          return false
        }
      }
      
      // Check termination date
      if (emp.status === 'terminated' && emp.terminationDate) {
        const terminationDate = new Date(emp.terminationDate)
        terminationDate.setHours(0, 0, 0, 0)
        const terminationMonth = `${terminationDate.getFullYear()}-${String(terminationDate.getMonth() + 1).padStart(2, '0')}`
        if (month > terminationMonth) {
          return false
        }
      }
      
      return true
    })
    
    if (filteredEmployees.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'لا يوجد موظفين لهذا الشهر',
        data: [] 
      })
    }
    
    const employeeIds = filteredEmployees.map(emp => emp.id)
    
    // Batch fetch all attendance records for all employees in one query
    // جلب جميع سجلات الحضور لجميع الموظفين في query واحد
    const allAttendance = await prisma.attendance.findMany({
      where: {
        employeeId: { in: employeeIds },
        date: { startsWith: month }
      },
      select: {
        id: true,
        employeeId: true,
        date: true,
        status: true,
        absentType: true,
        overtimeHours: true,
        timeDelayMinutes: true,
        nonTimeDelayMinutes: true
      }
    })
    
    // Batch fetch all deductions for all employees in one query
    // جلب جميع الخصومات لجميع الموظفين في query واحد
    const allDeductions = await prisma.deduction.findMany({
      where: {
        employeeId: { in: employeeIds },
        month: month
      },
      select: {
        id: true,
        employeeId: true,
        type: true,
        amount: true,
        description: true
      }
    })
    
    // Group attendance and deductions by employeeId for efficient lookup
    // تجميع الحضور والخصومات حسب employeeId للبحث السريع
    const attendanceByEmployee = {}
    const deductionsByEmployee = {}
    
    allAttendance.forEach(att => {
      if (!attendanceByEmployee[att.employeeId]) {
        attendanceByEmployee[att.employeeId] = []
      }
      attendanceByEmployee[att.employeeId].push(att)
    })
    
    allDeductions.forEach(ded => {
      if (!deductionsByEmployee[ded.employeeId]) {
        deductionsByEmployee[ded.employeeId] = []
      }
      deductionsByEmployee[ded.employeeId].push(ded)
    })
    
    // Calculate payroll for all employees
    // حساب الرواتب لجميع الموظفين
    const payrollData = []
    const payrollToUpsert = []
    
    for (const emp of filteredEmployees) {
      const attendance = attendanceByEmployee[emp.id] || []
      const deductions = deductionsByEmployee[emp.id] || []
      
      // Calculate payroll
      const payroll = calculatePayrollForEmployee(emp, attendance, deductions, month)
      
      if (payroll) {
        // Extract fields that are not in database schema (for display only)
        const { absentDeduction, monthlySalaryDue, ...payrollToSave } = payroll
        
        // Prepare for batch upsert
        payrollToUpsert.push({
          where: {
            employeeId_month: {
              employeeId: emp.id,
              month: month
            }
          },
          update: payrollToSave,
          create: payrollToSave
        })
        
        // Include display-only fields in response
        payroll.absentDeduction = absentDeduction
        payroll.monthlySalaryDue = monthlySalaryDue
        
        payrollData.push({ employee: emp, payroll })
      }
    }
    
    // Batch upsert all payroll records using transaction
    // Batch upsert لجميع سجلات الرواتب باستخدام transaction
    await prisma.$transaction(
      payrollToUpsert.map(p => 
        prisma.payroll.upsert(p)
      )
    )
    
    return NextResponse.json({ 
      success: true, 
      message: 'تم حساب الرواتب بنجاح',
      data: payrollData 
    })
  } catch (error) {
    logError(error, 'Payroll Calculate API')
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    const { error: errorMessage, status } = handleApiError(error, 'Payroll Calculate API')
    return NextResponse.json({ error: errorMessage }, { status })
  }
}

