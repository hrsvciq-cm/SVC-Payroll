import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError, handleApiError } from '@/lib/error-handler'

// PUT - Update attendance
export async function PUT(request, { params }) {
  try {
    // Check if user is authenticated via Supabase
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = params
    const data = await request.json()
    
    // Build update data object
    const updateData = {}
    
    // Handle status and absentType
    if (data.status !== undefined) {
      let status = data.status
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
      } else {
        // Clear absentType for non-absent statuses
        absentType = null
      }
      
      updateData.status = status
      // Conditionally add absentType
      // This will work once Prisma Client is regenerated with the new schema
      if (absentType !== null && absentType !== undefined) {
        updateData.absentType = absentType
      } else {
        // Set to null explicitly to clear it (only if field exists in schema)
        updateData.absentType = null
      }
    }
    
    // Handle overtime and delays
    if (data.overtimeHours !== undefined) {
      updateData.overtimeHours = parseFloat(data.overtimeHours) || 0
    }
    if (data.timeDelayMinutes !== undefined) {
      updateData.timeDelayMinutes = parseInt(data.timeDelayMinutes) || 0
    }
    if (data.nonTimeDelayMinutes !== undefined) {
      updateData.nonTimeDelayMinutes = parseInt(data.nonTimeDelayMinutes) || 0
    }
    
    const attendance = await prisma.attendance.update({
      where: { id: parseInt(id) },
      data: updateData
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'تم تحديث الحضور بنجاح',
      data: attendance 
    })
  } catch (error) {
    logError(error, 'Attendance API - PUT')
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    const { error: errorMessage, status: errorStatus } = handleApiError(error, 'Attendance API')
    return NextResponse.json({ error: errorMessage }, { status: errorStatus })
  }
}

// DELETE - Delete attendance
export async function DELETE(request, { params }) {
  try {
    // Check if user is authenticated via Supabase
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = params
    
    await prisma.attendance.delete({
      where: { id: parseInt(id) }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'تم حذف الحضور بنجاح'
    })
  } catch (error) {
    logError(error, 'Attendance API - DELETE')
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    const { error: errorMessage, status: errorStatus } = handleApiError(error, 'Attendance API')
    return NextResponse.json({ error: errorMessage }, { status: errorStatus })
  }
}

