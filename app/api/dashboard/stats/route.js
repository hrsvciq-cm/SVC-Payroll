import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError, handleApiError } from '@/lib/error-handler'

export async function GET(request) {
  try {
    // Check if user is authenticated via Supabase
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    
    // Try getSession first as it's more reliable for fresh logins
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    let user = null
    if (session && session.user) {
      user = session.user
    } else {
      // Fallback to getUser if session is not available
      const { data: { user: userData }, error: userError } = await supabase.auth.getUser()
      if (userData && !userError) {
        user = userData
      }
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // YYYY-MM format
    const employeeId = searchParams.get('employeeId')
    const viewType = searchParams.get('viewType') || 'currentMonth' // currentMonth, customRange
    
    const today = new Date().toISOString().split('T')[0]
    
    // Calculate date range
    let startDate, endDate, periodLabel
    if (viewType === 'currentMonth' || (!month && viewType !== 'selectedMonth')) {
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      periodLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    } else if (month) {
      // month is in YYYY-MM format
      const [year, monthNum] = month.split('-')
      startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1).toISOString().split('T')[0]
      endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0]
      periodLabel = month
    } else {
      // Default to current month if no month specified
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      periodLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    }
    
    // Build where clause for attendance
    const attendanceWhere = {
      date: {
        gte: startDate,
        lte: endDate
      }
    }
    
    if (employeeId) {
      attendanceWhere.employeeId = parseInt(employeeId)
    }
    
    // Optimize: Get attendance records with only needed fields
    // تحسين: جلب سجلات الحضور مع الحقول المطلوبة فقط
    const attendanceRecords = await prisma.attendance.findMany({
      where: attendanceWhere,
      select: {
        id: true,
        date: true,
        status: true,
        employee: {
          select: {
            id: true,
            name: true,
            employeeNumber: true,
            branch: true,
            department: true,
            status: true,
            terminationDate: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })
    
    // Filter attendance based on employee status and dates (in memory - more efficient)
    // تصفية الحضور حسب حالة الموظف والتواريخ (في الذاكرة - أكثر فعالية)
    const filteredAttendance = attendanceRecords.filter(att => {
      const emp = att.employee
      if (!emp) return false
      
      // Check if employee was active on this date
      if (emp.status === 'terminated' && emp.terminationDate) {
        const attDate = new Date(att.date)
        const terminationDate = new Date(emp.terminationDate)
        // Only include if attendance date is before or on termination date
        return attDate <= terminationDate
      }
      
      return true
    })
    
    // Calculate statistics efficiently using reduce
    // حساب الإحصائيات بشكل فعال باستخدام reduce
    const stats = filteredAttendance.reduce((acc, att) => {
      acc.totalDays++
      switch(att.status) {
        case 'present':
          acc.presentDays++
          break
        case 'absent':
          acc.absentDays++
          break
        case 'leave':
          acc.leaveDays++
          break
        case 'holiday':
          acc.holidayDays++
          break
      }
      return acc
    }, {
      totalEmployees: 0,
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      leaveDays: 0,
      holidayDays: 0,
      attendanceRate: 0,
      period: periodLabel
    })
    
    // Calculate attendance rate
    if (stats.totalDays > 0) {
      stats.attendanceRate = ((stats.presentDays + stats.holidayDays) / stats.totalDays * 100).toFixed(1)
    }
    
    // Build employee where clause efficiently
    // بناء where clause للموظفين بشكل فعال
    const employeeWhere = {}
    if (employeeId) {
      employeeWhere.id = parseInt(employeeId)
    } else {
      employeeWhere.status = {
        not: 'terminated'
      }
    }
    
    // Parallel fetch all counts and employee list
    // جلب جميع العدادات وقائمة الموظفين بشكل متوازي
    const [totalEmployees, activeEmployees, suspendedEmployees, todayAttendance, employees] = await Promise.all([
      employeeId ? Promise.resolve(1) : prisma.employee.count({ where: employeeWhere }),
      prisma.employee.count({ 
        where: { ...employeeWhere, status: 'active' } 
      }),
      prisma.employee.count({ 
        where: { ...employeeWhere, status: 'suspended' } 
      }),
      prisma.attendance.count({
        where: {
          date: today
        }
      }),
      // Only fetch employees list if not filtering by employeeId
      employeeId ? Promise.resolve([]) : prisma.employee.findMany({
        where: {
          status: {
            not: 'terminated'
          }
        },
        select: {
          id: true,
          name: true,
          employeeNumber: true
        },
        orderBy: {
          employeeNumber: 'asc'
        }
      })
    ])
    
    stats.totalEmployees = totalEmployees
    
    return NextResponse.json({
      ...stats,
      activeEmployees,
      suspendedEmployees,
      todayAttendance,
      attendanceDetails: filteredAttendance.map(att => ({
        id: att.id,
        date: att.date,
        status: att.status,
        employee: {
          id: att.employee.id,
          name: att.employee.name,
          employeeNumber: att.employee.employeeNumber,
          branch: att.employee.branch,
          department: att.employee.department
        }
      })),
      employees
    })
  } catch (error) {
    logError(error, 'Dashboard Stats API')
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { error: errorMessage, status } = handleApiError(error, 'Dashboard Stats')
    return NextResponse.json({ error: errorMessage }, { status })
  }
}

