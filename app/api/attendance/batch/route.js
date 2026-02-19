import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logError, handleApiError } from '@/lib/error-handler'

// POST - Create or update multiple attendance records at once
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
    if (!data.employeeId || !data.startDate || !data.endDate) {
      return NextResponse.json({ error: 'البيانات المطلوبة غير مكتملة' }, { status: 400 })
    }
    
    const employeeId = parseInt(data.employeeId)
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)
    const excludeWeekends = data.excludeWeekends || false
    
    if (startDate > endDate) {
      return NextResponse.json({ error: 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية' }, { status: 400 })
    }
    
    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    })
    
    if (!employee) {
      return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 })
    }
    
    // Handle status and absentType
    let status = data.status || 'present'
    let absentType = null
    
    if (status === 'absent') {
      if (data.absentType === 'without_notice') {
        absentType = 'without_notice'
      } else {
        absentType = 'with_notice'
      }
    } else if (status === 'absent_without_notice') {
      status = 'absent'
      absentType = 'without_notice'
    }
    
    // Generate list of dates
    const dates = []
    const current = new Date(startDate)
    current.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(0, 0, 0, 0)
    
    while (current <= end) {
      const dayOfWeek = current.getDay()
      
      // Skip weekends if option is checked
      if (!excludeWeekends || (dayOfWeek !== 5 && dayOfWeek !== 6)) {
        const dateStr = current.toISOString().split('T')[0]
        
        // Validate date constraints
        const attendanceDate = new Date(dateStr)
        attendanceDate.setHours(0, 0, 0, 0)
        
        let isValid = true
        let errorMessage = null
        
        if (employee.hireDate) {
          const hireDate = new Date(employee.hireDate)
          hireDate.setHours(0, 0, 0, 0)
          if (attendanceDate < hireDate) {
            isValid = false
            errorMessage = `لا يمكن تسجيل الدوام قبل تاريخ التعيين`
          }
        }
        
        if (isValid && employee.status === 'suspended' && employee.suspensionDate) {
          const suspensionDate = new Date(employee.suspensionDate)
          suspensionDate.setHours(0, 0, 0, 0)
          if (attendanceDate >= suspensionDate) {
            isValid = false
            errorMessage = `لا يمكن تسجيل الدوام في تاريخ الإيقاف أو بعده`
          }
        }
        
        if (isValid && employee.status === 'terminated' && employee.terminationDate) {
          const terminationDate = new Date(employee.terminationDate)
          terminationDate.setHours(0, 0, 0, 0)
          if (attendanceDate > terminationDate) {
            isValid = false
            errorMessage = `لا يمكن تسجيل الدوام بعد تاريخ إنهاء الخدمة`
          }
        }
        
        if (isValid) {
          dates.push(dateStr)
        }
      }
      
      current.setDate(current.getDate() + 1)
    }
    
    if (dates.length === 0) {
      return NextResponse.json({ 
        error: 'لا توجد أيام صالحة للتسجيل',
        successCount: 0,
        skipCount: 0,
        failedCount: 0
      }, { status: 400 })
    }
    
    // Get existing attendance records for these dates
    const existingRecords = await prisma.attendance.findMany({
      where: {
        employeeId: employeeId,
        date: {
          in: dates
        }
      },
      select: {
        id: true,
        date: true
      }
    })
    
    const existingDatesMap = new Map()
    existingRecords.forEach(record => {
      existingDatesMap.set(record.date, record.id)
    })
    
    // Prepare data for batch operations
    const toCreate = []
    const toUpdate = []
    
    dates.forEach(dateStr => {
      const baseData = {
        employeeId: employeeId,
        date: dateStr,
        status: status,
        overtimeHours: 0,
        timeDelayMinutes: 0,
        nonTimeDelayMinutes: 0
      }
      
      if (absentType !== null) {
        baseData.absentType = absentType
      }
      
      if (existingDatesMap.has(dateStr)) {
        // Update existing
        toUpdate.push({
          id: existingDatesMap.get(dateStr),
          data: {
            status: status,
            ...(absentType !== null && { absentType: absentType })
          }
        })
      } else {
        // Create new
        toCreate.push(baseData)
      }
    })
    
    // Execute batch operations
    let successCount = 0
    let failedCount = 0
    
    try {
      // Batch create
      if (toCreate.length > 0) {
        const createResult = await prisma.attendance.createMany({
          data: toCreate,
          skipDuplicates: true
        })
        successCount += createResult.count
      }
      
      // Batch update
      if (toUpdate.length > 0) {
        const updateResults = await Promise.allSettled(
          toUpdate.map(({ id, data }) =>
            prisma.attendance.update({
              where: { id },
              data
            })
          )
        )
        updateResults.forEach(result => {
          if (result.status === 'fulfilled') {
            successCount++
          } else {
            failedCount++
          }
        })
      }
    } catch (error) {
      logError(error, 'Attendance API - Batch POST')
      // If batch create fails completely, try individual creates
      if (toCreate.length > 0) {
        for (const record of toCreate) {
          try {
            await prisma.attendance.create({
              data: record
            })
            successCount++
          } catch (individualError) {
            if (individualError.code !== 'P2002') {
              failedCount++
            } else {
              // Already exists, try to update
              try {
                const existing = await prisma.attendance.findUnique({
                  where: {
                    employeeId_date: {
                      employeeId: record.employeeId,
                      date: record.date
                    }
                  }
                })
                if (existing) {
                  await prisma.attendance.update({
                    where: { id: existing.id },
                    data: {
                      status: record.status,
                      ...(record.absentType && { absentType: record.absentType })
                    }
                  })
                  successCount++
                } else {
                  failedCount++
                }
              } catch (updateError) {
                failedCount++
              }
            }
          }
        }
      }
    }
    
    const skipCount = dates.length - successCount - failedCount
    
    return NextResponse.json({
      success: true,
      message: `تم تسجيل ${successCount} يوم بنجاح`,
      successCount,
      skipCount,
      failedCount,
      totalDays: dates.length
    })
  } catch (error) {
    logError(error, 'Attendance API - Batch POST')
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    const { error: errorMessage, status: errorStatus } = handleApiError(error, 'Attendance API - Batch')
    return NextResponse.json({ error: errorMessage }, { status: errorStatus })
  }
}

