import { NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError, handleApiError } from '@/lib/error-handler'

// GET - Get payroll records
export async function GET(request) {
  try {
    // Check if user is authenticated via Supabase
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const month = searchParams.get('month')
    
    const where = {}
    
    if (employeeId) {
      where.employeeId = parseInt(employeeId)
    }
    
    if (month) {
      where.month = month
    }
    
    // Optimize: Select only needed fields
    // تحسين: اختيار الحقول المطلوبة فقط
    let payroll = await prisma.payroll.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        month: true,
        presentDays: true,
        absentDays: true,
        absentDaysWithNotice: true,
        absentDaysWithoutNotice: true,
        leaveDays: true,
        holidayDays: true,
        daysDue: true,
        lastWorkingDay: true,
        overtimeHours: true,
        timeDelayMinutes: true,
        nonTimeDelayMinutes: true,
        overtimePay: true,
        timeDelayDeduction: true,
        nonTimeDelayDeduction: true,
        baseSalary: true,
        totalDeductions: true,
        totalBonuses: true,
        totalAdvances: true,
        netSalary: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            name: true,
            employeeNumber: true,
            branch: true,
            department: true,
            position: true,
            salary: true,
            status: true,
            terminationDate: true
          }
        }
      },
      orderBy: [
        { month: 'desc' },
        { employeeId: 'asc' }
      ]
    })
    
    // Filter out terminated employees for months after their termination
    // تصفية الموظفين المنتهية خدماتهم للأشهر بعد الإنهاء
    if (month) {
      const [year, monthNum] = month.split('-')
      const monthStart = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
      
      payroll = payroll.filter(pay => {
        const emp = pay.employee
        // If employee is terminated, check if termination date is before this month
        // إذا كان الموظف منتهي الخدمة، تحقق من أن تاريخ الإنهاء قبل هذا الشهر
        if (emp.status === 'terminated' && emp.terminationDate) {
          const terminationDate = new Date(emp.terminationDate)
          terminationDate.setHours(0, 0, 0, 0)
          
          // Calculate termination month
          // حساب شهر الإنهاء
          const terminationMonth = `${terminationDate.getFullYear()}-${String(terminationDate.getMonth() + 1).padStart(2, '0')}`
          
          // Only include if this month is the termination month or before it
          // إدراج فقط إذا كان هذا الشهر هو شهر الإنهاء أو قبله
          if (month > terminationMonth) {
            return false // Terminated before this month - انتهت الخدمة قبل هذا الشهر
          }
        }
        return true
      })
    }
    
    return NextResponse.json({ data: payroll })
  } catch (error) {
    logError(error, 'Payroll API - GET')
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { error: errorMessage, status: errorStatus } = handleApiError(error, 'Payroll API')
    return NextResponse.json({ error: errorMessage }, { status: errorStatus })
  }
}

