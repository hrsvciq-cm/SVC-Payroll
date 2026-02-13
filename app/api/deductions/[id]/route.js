import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError, handleApiError } from '@/lib/error-handler'

// PUT - Update deduction
export async function PUT(request, { params }) {
  try {
    await requireRole(['admin', 'hr'])
    
    const data = await request.json()
    const id = parseInt(params.id)
    
    const deduction = await prisma.deduction.update({
      where: { id },
      data: {
        type: data.type,
        amount: parseFloat(data.amount),
        description: data.description
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'تم تحديث البيانات بنجاح',
      data: deduction 
    })
  } catch (error) {
    logError(error, 'Deduction API - PUT')
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    const { error: errorMessage, status: errorStatus } = handleApiError(error, 'Deduction API')
    return NextResponse.json({ error: errorMessage }, { status: errorStatus })
  }
}

// DELETE - Delete deduction
export async function DELETE(request, { params }) {
  try {
    await requireRole(['admin', 'hr'])
    
    const id = parseInt(params.id)
    
    await prisma.deduction.delete({
      where: { id }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'تم حذف البيانات بنجاح'
    })
  } catch (error) {
    logError(error, 'Deduction API - DELETE')
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    const { error: errorMessage, status: errorStatus } = handleApiError(error, 'Deduction API')
    return NextResponse.json({ error: errorMessage }, { status: errorStatus })
  }
}

