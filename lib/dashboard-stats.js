/**
 * Server-only: fetch dashboard stats. Used by API route and SSR dashboard page.
 * لا يستخدم في العميل - للاستخدام في الخادم فقط
 */
import { prisma } from '@/lib/prisma'

const ATTENDANCE_DETAILS_LIMIT = 500

export async function getDashboardStats(options = {}) {
  const { month, employeeId, viewType = 'currentMonth' } = options
  const today = new Date().toISOString().split('T')[0]

  let startDate, endDate, periodLabel
  if (viewType === 'currentMonth' || (!month && viewType !== 'selectedMonth')) {
    const now = new Date()
    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    periodLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  } else if (month) {
    const [year, monthNum] = month.split('-')
    startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1).toISOString().split('T')[0]
    endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0]
    periodLabel = month
  } else {
    const now = new Date()
    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    periodLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  const attendanceWhere = {
    date: { gte: startDate, lte: endDate }
  }
  if (employeeId) attendanceWhere.employeeId = parseInt(employeeId)

  const attendanceRecords = await prisma.attendance.findMany({
    where: attendanceWhere,
    take: ATTENDANCE_DETAILS_LIMIT,
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
    orderBy: { date: 'desc' }
  })

  const filteredAttendance = attendanceRecords.filter(att => {
    const emp = att.employee
    if (!emp) return false
    if (emp.status === 'terminated' && emp.terminationDate) {
      return new Date(att.date) <= new Date(emp.terminationDate)
    }
    return true
  })

  const stats = filteredAttendance.reduce((acc, att) => {
    acc.totalDays++
    switch (att.status) {
      case 'present': acc.presentDays++; break
      case 'absent': acc.absentDays++; break
      case 'leave': acc.leaveDays++; break
      case 'holiday': acc.holidayDays++; break
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

  if (stats.totalDays > 0) {
    stats.attendanceRate = ((stats.presentDays + stats.holidayDays) / stats.totalDays * 100).toFixed(1)
  }

  const employeeWhere = employeeId ? { id: parseInt(employeeId) } : { status: { not: 'terminated' } }

  const [totalEmployees, activeEmployees, suspendedEmployees, todayAttendance, employees] = await Promise.all([
    employeeId ? Promise.resolve(1) : prisma.employee.count({ where: employeeWhere }),
    prisma.employee.count({ where: { ...employeeWhere, status: 'active' } }),
    prisma.employee.count({ where: { ...employeeWhere, status: 'suspended' } }),
    prisma.attendance.count({ where: { date: today } }),
    prisma.employee.findMany({
      where: { status: { not: 'terminated' } },
      select: { id: true, name: true, employeeNumber: true },
      orderBy: { employeeNumber: 'asc' }
    })
  ])

  stats.totalEmployees = totalEmployees

  return {
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
  }
}
