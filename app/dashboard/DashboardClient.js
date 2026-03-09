'use client'

import { useState } from 'react'
import useSWR from 'swr'
import QuickActionCard from '@/app/components/QuickActionCard'
import EmployeeSelect from '@/app/components/EmployeeSelect'
import { fetcher } from '@/lib/fetcher'

const defaultStats = {
  totalEmployees: 0,
  activeEmployees: 0,
  suspendedEmployees: 0,
  todayAttendance: 0,
  totalDays: 0,
  presentDays: 0,
  absentDays: 0,
  leaveDays: 0,
  holidayDays: 0,
  attendanceRate: 0,
  period: ''
}

export default function DashboardClient({ initialData, initialError, initialFilters }) {
  const [filters, setFilters] = useState(initialFilters || {
    month: '',
    employeeId: '',
    viewType: 'currentMonth'
  })

  const params = new URLSearchParams()
  if (filters.month) params.append('month', filters.month)
  if (filters.employeeId) params.append('employeeId', filters.employeeId)
  params.append('viewType', filters.viewType)
  const swrKey = `/api/dashboard/stats?${params.toString()}`

  const { data, error, isLoading, mutate } = useSWR(swrKey, fetcher, {
    fallbackData: initialData,
    revalidateOnMount: !initialData,
    revalidateOnFocus: false,
    dedupingInterval: 20000
  })

  const stats = data || defaultStats
  const attendanceDetails = data?.attendanceDetails || []
  const employees = data?.employees || []
  const loading = isLoading && !data
  const hasData = (stats.totalEmployees > 0 || stats.totalDays > 0) || employees.length > 0
  const showLoading = loading && !hasData
  const connectionError = initialError || error

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const getStatusLabel = (status) => {
    const labels = { present: 'حاضر', absent: 'غائب', leave: 'إجازة', holiday: 'عطلة' }
    return labels[status] || status
  }

  const getStatusBadgeStyle = (status) => {
    const styles = {
      present: { background: '#d4edda', color: '#155724' },
      absent: { background: '#f8d7da', color: '#721c24' },
      leave: { background: '#fff3cd', color: '#856404' },
      holiday: { background: '#d1ecf1', color: '#0c5460' }
    }
    return styles[status] || { background: '#e2e3e5', color: '#383d41' }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-IQ', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCurrentMonth = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  if (showLoading && !connectionError) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>جاري التحميل...</p>
      </div>
    )
  }

  return (
    <>
    {connectionError && (
      <div style={{
        marginBottom: '16px',
        padding: '12px 16px',
        background: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '8px',
        color: '#856404',
        fontSize: '14px'
      }}>
        لا يمكن الاتصال بقاعدة البيانات أو Supabase. تحقق من الاتصال بالإنترنت وإعدادات .env
        <button
          type="button"
          onClick={() => mutate()}
          style={{ marginRight: '12px', marginTop: '8px', padding: '6px 12px', background: '#856404', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
        >
          إعادة المحاولة
        </button>
      </div>
    )}
    <div className="dashboard-main-container" style={{
        width: '100%',
        maxWidth: '1920px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '8px',
        padding: 'clamp(16px, 4vw, 40px)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
          لوحة التحكم - دوام الموظفين
        </h1>
        <p style={{ fontSize: 'clamp(14px, 3vw, 16px)', color: '#666', marginBottom: 'clamp(20px, 4vw, 32px)' }}>
          مرحباً بك في نظام إدارة الدوام والرواتب
        </p>

        <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: 'clamp(16px, 3vw, 20px)', marginBottom: 'clamp(16px, 3vw, 24px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 'clamp(12px, 2vw, 16px)', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333', fontSize: '14px' }}>الشهر:</label>
              <input
                type="month"
                value={filters.month || getCurrentMonth()}
                onChange={(e) => {
                  handleFilterChange('month', e.target.value)
                  if (e.target.value) handleFilterChange('viewType', 'selectedMonth')
                }}
                disabled={filters.viewType === 'currentMonth'}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', opacity: filters.viewType === 'currentMonth' ? 0.6 : 1, cursor: filters.viewType === 'currentMonth' ? 'not-allowed' : 'text' }}
              />
            </div>
            <EmployeeSelect
              id="dashboard-employee-select"
              employees={employees}
              value={filters.employeeId}
              onChange={(v) => handleFilterChange('employeeId', v)}
            />
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333', fontSize: '14px' }}>عرض حسب:</label>
              <select
                value={filters.viewType}
                onChange={(e) => {
                  handleFilterChange('viewType', e.target.value)
                  if (e.target.value === 'currentMonth') handleFilterChange('month', '')
                }}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', background: 'white' }}
              >
                <option value="currentMonth">الشهر الحالي</option>
                <option value="selectedMonth">الشهر المحدد</option>
              </select>
            </div>
          </div>
          <button onClick={() => mutate()} style={{ padding: '10px 24px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            عرض البيانات
          </button>
        </div>

        {/* Stats cards - same as before */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 'clamp(12px, 2.5vw, 20px)', marginBottom: 'clamp(20px, 4vw, 32px)' }}>
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: 'clamp(16px, 3vw, 24px)', color: 'white' }}>
            <div style={{ fontSize: 'clamp(24px, 5vw, 32px)', marginBottom: '8px' }}>👥</div>
            <div style={{ fontSize: 'clamp(28px, 6vw, 36px)', fontWeight: 'bold', marginBottom: '4px' }}>{stats.totalEmployees}</div>
            <div style={{ fontSize: 'clamp(12px, 2.5vw, 14px)', opacity: 0.9 }}>عدد الموظفين</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', borderRadius: '12px', padding: 'clamp(16px, 3vw, 24px)', color: 'white' }}>
            <div style={{ fontSize: 'clamp(24px, 5vw, 32px)', marginBottom: '8px' }}>✅</div>
            <div style={{ fontSize: 'clamp(28px, 6vw, 36px)', fontWeight: 'bold', marginBottom: '4px' }}>{stats.activeEmployees}</div>
            <div style={{ fontSize: 'clamp(12px, 2.5vw, 14px)', opacity: 0.9 }}>موظفين نشطين</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: '12px', padding: 'clamp(16px, 3vw, 24px)', color: 'white' }}>
            <div style={{ fontSize: 'clamp(24px, 5vw, 32px)', marginBottom: '8px' }}>⏸️</div>
            <div style={{ fontSize: 'clamp(28px, 6vw, 36px)', fontWeight: 'bold', marginBottom: '4px' }}>{stats.suspendedEmployees}</div>
            <div style={{ fontSize: 'clamp(12px, 2.5vw, 14px)', opacity: 0.9 }}>موظفين موقوفين</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderRadius: '12px', padding: 'clamp(16px, 3vw, 24px)', color: 'white' }}>
            <div style={{ fontSize: 'clamp(24px, 5vw, 32px)', marginBottom: '8px' }}>📅</div>
            <div style={{ fontSize: 'clamp(28px, 6vw, 36px)', fontWeight: 'bold', marginBottom: '4px' }}>{stats.todayAttendance}</div>
            <div style={{ fontSize: 'clamp(12px, 2.5vw, 14px)', opacity: 0.9 }}>دوام اليوم</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 'clamp(12px, 2vw, 16px)', marginBottom: 'clamp(20px, 4vw, 32px)' }}>
          {[
            { icon: '🎉', value: stats.holidayDays, label: 'أيام العطل' },
            { icon: '🏖️', value: stats.leaveDays, label: 'أيام الإجازة' },
            { icon: '❌', value: stats.absentDays, label: 'أيام الغياب' },
            { icon: '✅', value: stats.presentDays, label: 'أيام الحضور' },
            { icon: '📅', value: stats.totalDays, label: 'إجمالي أيام الدوام' },
            { icon: '📊', value: `${stats.attendanceRate}%`, label: 'نسبة الحضور' },
            { icon: '📆', value: stats.period || '-', label: 'الفترة المحددة' }
          ].map(({ icon, value, label }) => (
            <div key={label} style={{ background: 'white', borderRadius: '12px', padding: 'clamp(16px, 3vw, 20px)', border: '1px solid #e0e0e0', textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(20px, 4vw, 28px)', marginBottom: '8px' }}>{icon}</div>
              <div style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>{value}</div>
              <div style={{ fontSize: 'clamp(11px, 2vw, 13px)', color: '#666' }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: '8px', padding: 'clamp(16px, 3vw, 24px)', marginBottom: 'clamp(20px, 4vw, 32px)', border: '1px solid #e0e0e0' }}>
          <h2 style={{ fontSize: 'clamp(18px, 4vw, 20px)', fontWeight: '600', marginBottom: 'clamp(16px, 3vw, 20px)', color: '#333' }}>تفاصيل الدوام</h2>
          {attendanceDetails.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'clamp(30px, 6vw, 40px)', color: '#666' }}>
              <p style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}>لا توجد سجلات دوام في الفترة المحددة</p>
            </div>
          ) : (
            <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
                    {['التاريخ', 'الرقم الوظيفي', 'الاسم', 'الفرع', 'القسم', 'الحالة'].map(h => (
                      <th key={h} style={{ padding: 'clamp(8px, 1.5vw, 12px)', textAlign: 'right', fontWeight: '600', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendanceDetails.map((detail) => (
                    <tr key={detail.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: 'clamp(8px, 1.5vw, 12px)', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>{formatDate(detail.date)}</td>
                      <td style={{ padding: 'clamp(8px, 1.5vw, 12px)', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>{detail.employee.employeeNumber}</td>
                      <td style={{ padding: 'clamp(8px, 1.5vw, 12px)', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>{detail.employee.name}</td>
                      <td style={{ padding: 'clamp(8px, 1.5vw, 12px)', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>{detail.employee.branch || '-'}</td>
                      <td style={{ padding: 'clamp(8px, 1.5vw, 12px)', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>{detail.employee.department || '-'}</td>
                      <td style={{ padding: 'clamp(8px, 1.5vw, 12px)', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: 'clamp(10px, 2vw, 12px)', fontWeight: '600', whiteSpace: 'nowrap', ...getStatusBadgeStyle(detail.status) }}>
                          {getStatusLabel(detail.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: 'clamp(16px, 3vw, 24px)', marginTop: 'clamp(20px, 4vw, 32px)' }}>
          <h2 style={{ fontSize: 'clamp(18px, 4vw, 20px)', fontWeight: '600', marginBottom: 'clamp(12px, 2vw, 16px)', color: '#333' }}>إجراءات سريعة</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 'clamp(10px, 2vw, 12px)' }}>
            <QuickActionCard href="/employees" icon="👥" label="إدارة الموظفين" />
            <QuickActionCard href="/attendance" icon="📅" label="تسجيل الدوام" />
            <QuickActionCard href="/payroll" icon="💰" label="الرواتب" />
            <QuickActionCard href="/reports" icon="📈" label="التقارير" />
          </div>
        </div>
      </div>
    <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 1536px) { .dashboard-main-container { max-width: 1920px; margin: 0 auto; } }
        @media (max-width: 768px) { .dashboard-main-container { padding: 16px !important; } .table-responsive table { font-size: 12px; } .table-responsive th, .table-responsive td { padding: 8px 4px !important; } }
      `}} />
    </>
  )
}
