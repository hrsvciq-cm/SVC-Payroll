import { NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError, handleApiError } from '@/lib/error-handler'

// GET - Get all employees (with filters)
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
    const status = searchParams.get('status')
    const includeTerminated = searchParams.get('includeTerminated') === 'true'
    
    const where = {}
    
    if (status) {
      where.status = status
    } else if (!includeTerminated) {
      // Default: exclude terminated employees
      where.status = {
        not: 'terminated'
      }
    }
    
    // Optimize: Select only needed fields
    // تحسين: اختيار الحقول المطلوبة فقط
    const employees = await prisma.employee.findMany({
      where,
      select: {
        id: true,
        employeeNumber: true,
        name: true,
        branch: true,
        department: true,
        position: true,
        salary: true,
        workHours: true,
        hireDate: true,
        status: true,
        statusChangeDate: true,
        suspensionType: true,
        suspensionDate: true,
        terminationDate: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { employeeNumber: 'asc' }
      ]
    })
    
    return NextResponse.json({ data: employees })
  } catch (error) {
    logError(error, 'Employees API - GET')
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { error: errorMessage, status } = handleApiError(error, 'Employees API')
    return NextResponse.json({ error: errorMessage }, { status })
  }
}

// POST - Create new employee
export async function POST(request) {
  try {
    await requireRole(['admin', 'hr'])
    
    const data = await request.json()
    
    // Validate required fields
    if (!data.name || !data.employeeNumber || !data.salary) {
      return NextResponse.json({ error: 'البيانات المطلوبة غير مكتملة' }, { status: 400 })
    }
    
    // Check if employee number already exists
    const existing = await prisma.employee.findUnique({
      where: { employeeNumber: data.employeeNumber }
    })
    
    if (existing) {
      return NextResponse.json({ error: 'الرقم الوظيفي موجود مسبقاً' }, { status: 400 })
    }
    
    const employee = await prisma.employee.create({
      data: {
        employeeNumber: data.employeeNumber,
        name: data.name,
        branch: data.branch || '',
        department: data.department || '',
        position: data.position || '',
        salary: parseFloat(data.salary),
        workHours: parseFloat(data.workHours) || 8,
        hireDate: data.hireDate ? new Date(data.hireDate) : null,
        status: data.status || 'active',
        statusChangeDate: data.statusChangeDate ? new Date(data.statusChangeDate) : (data.hireDate ? new Date(data.hireDate) : new Date()),
        suspensionType: data.suspensionType || null,
        suspensionDate: data.suspensionDate ? new Date(data.suspensionDate) : null,
        terminationDate: data.terminationDate ? new Date(data.terminationDate) : null
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'تم إضافة الموظف بنجاح',
      data: employee 
    })
  } catch (error) {
    logError(error, 'Employees API - POST')
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    const { error: errorMessage, status } = handleApiError(error, 'Employees API')
    return NextResponse.json({ error: errorMessage }, { status })
  }
}

