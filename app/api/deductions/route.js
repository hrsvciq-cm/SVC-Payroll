import { NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError, handleApiError } from '@/lib/error-handler'

// GET - Get deductions
export async function GET(request) {
  try {
    await requireAuth()
    
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
    const deductions = await prisma.deduction.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        month: true,
        type: true,
        amount: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            name: true,
            employeeNumber: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    })
    
    return NextResponse.json({ data: deductions })
  } catch (error) {
    logError(error, 'Deductions API - GET')
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { error: errorMessage, status: errorStatus } = handleApiError(error, 'Deductions API')
    return NextResponse.json({ error: errorMessage }, { status: errorStatus })
  }
}

// POST - Create deduction/bonus/advance
export async function POST(request) {
  try {
    await requireRole(['admin', 'hr'])
    
    const data = await request.json()
    
    // Validate required fields
    if (!data.employeeId || !data.month || !data.type || !data.amount) {
      return NextResponse.json({ error: 'البيانات المطلوبة غير مكتملة' }, { status: 400 })
    }
    
    // Validate type
    if (!['deduction', 'bonus', 'advance'].includes(data.type)) {
      return NextResponse.json({ error: 'نوع العملية غير صحيح' }, { status: 400 })
    }
    
    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(data.employeeId) }
    })
    
    if (!employee) {
      return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 })
    }
    
    const deduction = await prisma.deduction.create({
      data: {
        employeeId: parseInt(data.employeeId),
        month: data.month,
        type: data.type,
        amount: parseFloat(data.amount),
        description: data.description || null
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: `تم إضافة ${data.type === 'deduction' ? 'الخصم' : data.type === 'bonus' ? 'المكافأة' : 'السلف'} بنجاح`,
      data: deduction 
    })
  } catch (error) {
    logError(error, 'Deductions API - POST')
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    const { error: errorMessage, status: errorStatus } = handleApiError(error, 'Deductions API')
    return NextResponse.json({ error: errorMessage }, { status: errorStatus })
  }
}

