import { NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError, handleApiError } from '@/lib/error-handler'

// GET - Get attendance records
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
    const date = searchParams.get('date')
    const month = searchParams.get('month')
    
    const where = {}
    
    if (employeeId) {
      where.employeeId = parseInt(employeeId)
    }
    
    if (date) {
      where.date = date
    } else if (month) {
      where.date = {
        startsWith: month
      }
    }
    
    // Optimize: Select only needed fields
    // تحسين: اختيار الحقول المطلوبة فقط
    const attendance = await prisma.attendance.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        date: true,
        status: true,
        absentType: true,
        overtimeHours: true,
        timeDelayMinutes: true,
        nonTimeDelayMinutes: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            name: true,
            employeeNumber: true,
            branch: true,
            department: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { employeeId: 'asc' }
      ]
    })
    
    return NextResponse.json({ data: attendance })
  } catch (error) {
    logError(error, 'Attendance API - GET')
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { error: errorMessage, status: errorStatus } = handleApiError(error, 'Attendance API')
    return NextResponse.json({ error: errorMessage }, { status: errorStatus })
  }
}

// POST - Create attendance record
export async function POST(request) {
  try {
    // Check if user is authenticated via Supabase
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const data = await request.json()
    
    // Validate required fields
    if (!data.employeeId || !data.date) {
      console.error('Missing required fields:', { employeeId: data.employeeId, date: data.date })
      return NextResponse.json({ error: 'البيانات المطلوبة غير مكتملة' }, { status: 400 })
    }
    
    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(data.employeeId) }
    })
    
    if (!employee) {
      return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 })
    }
    
    // Validate date constraints
    const attendanceDate = new Date(data.date)
    attendanceDate.setHours(0, 0, 0, 0)
    
    if (employee.hireDate) {
      const hireDate = new Date(employee.hireDate)
      hireDate.setHours(0, 0, 0, 0)
      if (attendanceDate < hireDate) {
        return NextResponse.json({ 
          error: `لا يمكن تسجيل الدوام قبل تاريخ التعيين (${new Date(employee.hireDate).toLocaleDateString('ar-SA')})` 
        }, { status: 400 })
      }
    }
    
    if (employee.status === 'suspended' && employee.suspensionDate) {
      const suspensionDate = new Date(employee.suspensionDate)
      suspensionDate.setHours(0, 0, 0, 0)
      if (attendanceDate >= suspensionDate) {
        return NextResponse.json({ 
          error: `لا يمكن تسجيل الدوام في تاريخ الإيقاف أو بعده` 
        }, { status: 400 })
      }
    }
    
    if (employee.status === 'terminated' && employee.terminationDate) {
      const terminationDate = new Date(employee.terminationDate)
      terminationDate.setHours(0, 0, 0, 0)
      if (attendanceDate > terminationDate) {
        return NextResponse.json({ 
          error: `لا يمكن تسجيل الدوام بعد تاريخ إنهاء الخدمة` 
        }, { status: 400 })
      }
    }
    
    // Check if attendance already exists for this employee and date
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: parseInt(data.employeeId),
          date: data.date
        }
      }
    })
    
    if (existing) {
      console.log(`Attendance already exists for employee ${data.employeeId} on date ${data.date}`)
      return NextResponse.json({ error: 'تم تسجيل الدوام لهذا الموظف في هذا التاريخ مسبقاً' }, { status: 400 })
    }
    
    // Handle status and absentType
    let status = data.status || 'present'
    let absentType = null
    
    // If status is 'absent', check if absentType is provided
    if (status === 'absent') {
      if (data.absentType === 'without_notice') {
        absentType = 'without_notice'
      } else {
        absentType = 'with_notice' // default for absent
      }
    } else if (status === 'absent_without_notice') {
      // Handle legacy format
      status = 'absent'
      absentType = 'without_notice'
    }
    
    // Build base data object
    const baseData = {
      employeeId: parseInt(data.employeeId),
      date: data.date,
      status: status,
      overtimeHours: parseFloat(data.overtimeHours) || 0,
      timeDelayMinutes: parseInt(data.timeDelayMinutes) || 0,
      nonTimeDelayMinutes: parseInt(data.nonTimeDelayMinutes) || 0
    }
    
    // Conditionally add absentType only if it's not null
    // This will work once Prisma Client is regenerated with the new schema
    const attendanceData = absentType !== null && absentType !== undefined
      ? { ...baseData, absentType }
      : baseData
    
    const attendance = await prisma.attendance.create({
      data: attendanceData
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'تم تسجيل الدوام بنجاح',
      data: attendance 
    })
  } catch (error) {
    logError(error, 'Attendance API - POST')
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'تم تسجيل الدوام لهذا الموظف في هذا التاريخ مسبقاً' }, { status: 400 })
    }
    const { error: errorMessage, status: errorStatus } = handleApiError(error, 'Attendance API')
    return NextResponse.json({ error: errorMessage }, { status: errorStatus })
  }
}

