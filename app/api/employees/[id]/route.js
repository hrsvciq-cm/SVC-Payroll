import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError, handleApiError } from '@/lib/error-handler'

// GET - Get employee by ID
export async function GET(request, { params }) {
  try {
    await requireRole(['admin', 'hr', 'finance', 'viewer'])
    
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(params.id) }
    })
    
    if (!employee) {
      return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 })
    }
    
    return NextResponse.json({ data: employee })
  } catch (error) {
    logError(error, 'Employee API - GET')
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    const { error: errorMessage, status: errorStatus } = handleApiError(error, 'Employee API')
    return NextResponse.json({ error: errorMessage }, { status: errorStatus })
  }
}

// PUT - Update employee
export async function PUT(request, { params }) {
  try {
    await requireRole(['admin', 'hr'])
    
    const data = await request.json()
    const id = parseInt(params.id)
    
    // Check if employee exists
    const existing = await prisma.employee.findUnique({
      where: { id }
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 })
    }
    
    // Check if employee number is being changed and if it's already taken
    if (data.employeeNumber && data.employeeNumber !== existing.employeeNumber) {
      const numberExists = await prisma.employee.findUnique({
        where: { employeeNumber: data.employeeNumber }
      })
      
      if (numberExists) {
        return NextResponse.json({ error: 'الرقم الوظيفي موجود مسبقاً' }, { status: 400 })
      }
    }
    
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        employeeNumber: data.employeeNumber || existing.employeeNumber,
        name: data.name || existing.name,
        branch: data.branch !== undefined ? data.branch : existing.branch,
        department: data.department !== undefined ? data.department : existing.department,
        position: data.position !== undefined ? data.position : existing.position,
        salary: data.salary !== undefined ? parseFloat(data.salary) : existing.salary,
        workHours: data.workHours !== undefined ? parseFloat(data.workHours) : existing.workHours,
        hireDate: data.hireDate ? new Date(data.hireDate) : existing.hireDate,
        status: data.status || existing.status,
        statusChangeDate: data.statusChangeDate ? new Date(data.statusChangeDate) : existing.statusChangeDate,
        suspensionType: data.suspensionType !== undefined ? data.suspensionType : existing.suspensionType,
        suspensionDate: data.suspensionDate ? new Date(data.suspensionDate) : existing.suspensionDate,
        terminationDate: data.terminationDate ? new Date(data.terminationDate) : existing.terminationDate
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'تم تحديث بيانات الموظف بنجاح',
      data: employee 
    })
  } catch (error) {
    logError(error, 'Employee API - PUT')
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    const { error: errorMessage, status: errorStatus } = handleApiError(error, 'Employee API')
    return NextResponse.json({ error: errorMessage }, { status: errorStatus })
  }
}

// DELETE - Delete employee
export async function DELETE(request, { params }) {
  try {
    await requireRole(['admin', 'hr'])
    
    const id = parseInt(params.id)
    
    // Check if employee exists
    const existing = await prisma.employee.findUnique({
      where: { id }
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 })
    }
    
    // Prevent deleting terminated employees (they are archived)
    if (existing.status === 'terminated') {
      return NextResponse.json({ error: 'لا يمكن حذف الموظف المنتهية خدمته' }, { status: 400 })
    }
    
    await prisma.employee.delete({
      where: { id }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'تم حذف الموظف بنجاح'
    })
  } catch (error) {
    logError(error, 'Employee API - DELETE')
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    const { error: errorMessage, status: errorStatus } = handleApiError(error, 'Employee API')
    return NextResponse.json({ error: errorMessage }, { status: errorStatus })
  }
}

