'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Layout from '@/app/components/Layout'
import QuickActionCard from '@/app/components/QuickActionCard'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
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
  })
  const [attendanceDetails, setAttendanceDetails] = useState([])
  const [employees, setEmployees] = useState([])
  const [filters, setFilters] = useState({
    month: '',
    employeeId: '',
    viewType: 'currentMonth'
  })

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      await loadDashboardData()
    }
    
    loadData()
  }, [router])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [filters])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.month) params.append('month', filters.month)
      if (filters.employeeId) params.append('employeeId', filters.employeeId)
      params.append('viewType', filters.viewType)
      
      const response = await fetch(`/api/dashboard/stats?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
        setAttendanceDetails(data.attendanceDetails || [])
        setEmployees(data.employees || [])
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const getStatusLabel = (status) => {
    const labels = {
      present: 'حاضر',
      absent: 'غائب',
      leave: 'إجازة',
      holiday: 'عطلة'
    }
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
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-IQ', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Get current month in YYYY-MM format
  const getCurrentMonth = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  if (loading && !stats.totalEmployees) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>جاري التحميل...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          marginBottom: '8px',
          color: '#333'
        }}>
          لوحة التحكم - دوام الموظفين
        </h1>
        <p style={{ 
          fontSize: '16px', 
          color: '#666',
          marginBottom: '32px'
        }}>
          مرحباً بك في نظام إدارة الدوام والرواتب
        </p>

        {/* Filters */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#333',
                fontSize: '14px'
              }}>
                الشهر:
              </label>
              <input
                type="month"
                value={filters.month || getCurrentMonth()}
                onChange={(e) => {
                  handleFilterChange('month', e.target.value)
                  if (e.target.value) {
                    handleFilterChange('viewType', 'selectedMonth')
                  }
                }}
                disabled={filters.viewType === 'currentMonth'}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  opacity: filters.viewType === 'currentMonth' ? 0.6 : 1,
                  cursor: filters.viewType === 'currentMonth' ? 'not-allowed' : 'text'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#333',
                fontSize: '14px'
              }}>
                الموظف (اختياري):
              </label>
              <select
                value={filters.employeeId}
                onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="">جميع الموظفين</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeNumber} - {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#333',
                fontSize: '14px'
              }}>
                عرض حسب:
              </label>
              <select
                value={filters.viewType}
                onChange={(e) => {
                  handleFilterChange('viewType', e.target.value)
                  if (e.target.value === 'currentMonth') {
                    handleFilterChange('month', '')
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                <option value="currentMonth">الشهر الحالي</option>
                <option value="selectedMonth">الشهر المحدد</option>
              </select>
            </div>
          </div>

          <button
            onClick={loadDashboardData}
            style={{
              padding: '10px 24px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            عرض البيانات
          </button>
        </div>

        {/* Basic Statistics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            padding: '24px',
            color: 'white'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '4px' }}>
              {stats.totalEmployees}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>عدد الموظفين</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            borderRadius: '12px',
            padding: '24px',
            color: 'white'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '4px' }}>
              {stats.activeEmployees}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>موظفين نشطين</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            borderRadius: '12px',
            padding: '24px',
            color: 'white'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏸️</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '4px' }}>
              {stats.suspendedEmployees}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>موظفين موقوفين</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: '12px',
            padding: '24px',
            color: 'white'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '4px' }}>
              {stats.todayAttendance}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>دوام اليوم</div>
          </div>
        </div>

        {/* Detailed Statistics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e0e0e0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎉</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>
              {stats.holidayDays}
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>أيام العطل</div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e0e0e0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏖️</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>
              {stats.leaveDays}
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>أيام الإجازة</div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e0e0e0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>❌</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>
              {stats.absentDays}
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>أيام الغياب</div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e0e0e0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>
              {stats.presentDays}
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>أيام الحضور</div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e0e0e0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📅</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>
              {stats.totalDays}
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>إجمالي أيام الدوام</div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e0e0e0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📊</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>
              {stats.attendanceRate}%
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>نسبة الحضور</div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e0e0e0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📆</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>
              {stats.period || '-'}
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>الفترة المحددة</div>
          </div>
        </div>

        {/* Attendance Details Table */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '32px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '20px',
            color: '#333'
          }}>
            تفاصيل الدوام
          </h2>
          
          {attendanceDetails.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#666'
            }}>
              <p>لا توجد سجلات دوام في الفترة المحددة</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    background: '#f8f9fa',
                    borderBottom: '2px solid #ddd'
                  }}>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>التاريخ</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>الرقم الوظيفي</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>الاسم</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>الفرع</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>القسم</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceDetails.map((detail) => (
                    <tr key={detail.id} style={{
                      borderBottom: '1px solid #eee'
                    }}>
                      <td style={{ padding: '12px' }}>{formatDate(detail.date)}</td>
                      <td style={{ padding: '12px' }}>{detail.employee.employeeNumber}</td>
                      <td style={{ padding: '12px' }}>{detail.employee.name}</td>
                      <td style={{ padding: '12px' }}>{detail.employee.branch || '-'}</td>
                      <td style={{ padding: '12px' }}>{detail.employee.department || '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          ...getStatusBadgeStyle(detail.status)
                        }}>
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

        {/* Quick Actions */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '24px',
          marginTop: '32px'
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            marginBottom: '16px',
            color: '#333'
          }}>
            إجراءات سريعة
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <QuickActionCard href="/employees" icon="👥" label="إدارة الموظفين" />
            <QuickActionCard href="/attendance" icon="📅" label="تسجيل الدوام" />
            <QuickActionCard href="/payroll" icon="💰" label="الرواتب" />
            <QuickActionCard href="/reports" icon="📈" label="التقارير" />
          </div>
        </div>
      </div>
    </Layout>
  )
}
