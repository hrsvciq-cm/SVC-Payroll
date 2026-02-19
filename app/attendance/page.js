'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Layout from '@/app/components/Layout'

export default function AttendancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState([])
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  
  // Form states
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedEmployees, setSelectedEmployees] = useState(new Set())
  const [attendanceStatus, setAttendanceStatus] = useState('present')
  
  // Multiple days form states
  const [multiDayEmployeeId, setMultiDayEmployeeId] = useState('')
  const [multiDayStartDate, setMultiDayStartDate] = useState('')
  const [multiDayEndDate, setMultiDayEndDate] = useState('')
  const [multiDayStatus, setMultiDayStatus] = useState('present')
  const [excludeWeekends, setExcludeWeekends] = useState(false)
  const [previewDaysCount, setPreviewDaysCount] = useState(0)
  
  // Modal states
  const [showIndividualModal, setShowIndividualModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showSelectModal, setShowSelectModal] = useState(false)
  const [showMultiDayModal, setShowMultiDayModal] = useState(false)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      try {
        // Load employees
        const empResponse = await fetch('/api/employees?includeTerminated=false')
        if (empResponse.ok) {
          const empResult = await empResponse.json()
          const activeEmps = (empResult.data || []).filter(emp => emp.status === 'active')
          setEmployees(activeEmps)
          
          // Extract unique departments
          const depts = [...new Set(activeEmps.map(emp => emp.department).filter(Boolean))]
          setDepartments(depts)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [router])

  useEffect(() => {
    async function loadAttendance() {
      try {
        const response = await fetch(`/api/attendance?date=${selectedDate}`)
        if (response.ok) {
          const result = await response.json()
          setAttendance(result.data || [])
        }
      } catch (error) {
        console.error('Error loading attendance:', error)
      }
    }
    
    if (selectedDate) {
      loadAttendance()
    }
  }, [selectedDate])

  // Update preview days count for multiple days
  useEffect(() => {
    if (multiDayStartDate && multiDayEndDate) {
      const start = new Date(multiDayStartDate)
      const end = new Date(multiDayEndDate)
      
      if (start > end) {
        setPreviewDaysCount(0)
        return
      }
      
      let count = 0
      const current = new Date(start)
      
      while (current <= end) {
        const dayOfWeek = current.getDay()
        // 5 = Friday, 6 = Saturday
        if (!excludeWeekends || (dayOfWeek !== 5 && dayOfWeek !== 6)) {
          count++
        }
        current.setDate(current.getDate() + 1)
      }
      
      setPreviewDaysCount(count)
    } else {
      setPreviewDaysCount(0)
    }
  }, [multiDayStartDate, multiDayEndDate, excludeWeekends])

  const handleIndividualAttendance = async () => {
    if (!selectedEmployeeId || !selectedDate) {
      alert('يرجى اختيار الموظف والتاريخ')
      return
    }

    try {
      // Handle status format
      let status = attendanceStatus
      let absentType = null
      if (attendanceStatus === 'absent_with_notice') {
        status = 'absent'
        absentType = 'with_notice'
      } else if (attendanceStatus === 'absent_without_notice') {
        status = 'absent'
        absentType = 'without_notice'
      }
      
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: parseInt(selectedEmployeeId),
          date: selectedDate,
          status: status,
          absentType: absentType
        })
      })

      if (response.ok) {
        alert('تم تسجيل الدوام بنجاح')
        setSelectedEmployeeId('')
        setShowIndividualModal(false)
        // Reload attendance
        const attResponse = await fetch(`/api/attendance?date=${selectedDate}`)
        if (attResponse.ok) {
          const attResult = await attResponse.json()
          setAttendance(attResult.data || [])
        }
      } else {
        const error = await response.json()
        alert(error.error || 'حدث خطأ في تسجيل الدوام')
      }
    } catch (error) {
      console.error('Error marking attendance:', error)
      alert('حدث خطأ في تسجيل الدوام')
    }
  }

  const handleBulkAttendance = async () => {
    if (!selectedDepartment || !selectedDate) {
      alert('يرجى اختيار القسم والتاريخ')
      return
    }

    const deptEmployees = employees.filter(emp => emp.department === selectedDepartment)
    
    if (deptEmployees.length === 0) {
      alert('لا يوجد موظفين نشطين في هذا القسم')
      return
    }

    if (!confirm(`هل تريد تسجيل دوام ${deptEmployees.length} موظف في قسم ${selectedDepartment}؟`)) {
      return
    }

    try {
      // Handle status format
      let status = attendanceStatus
      let absentType = null
      if (attendanceStatus === 'absent_with_notice') {
        status = 'absent'
        absentType = 'with_notice'
      } else if (attendanceStatus === 'absent_without_notice') {
        status = 'absent'
        absentType = 'without_notice'
      }
      
      let successCount = 0
      for (const emp of deptEmployees) {
        try {
          // Check if attendance already exists first
          const checkResponse = await fetch(`/api/attendance?employeeId=${emp.id}&date=${selectedDate}`)
          let existingId = null
          
          if (checkResponse.ok) {
            const checkData = await checkResponse.json()
            if (checkData.data && checkData.data.length > 0) {
              existingId = checkData.data[0].id
            }
          }
          
          // Build request body - only include absentType if it's not null
          const requestBody = {
            status: status
          }
          if (absentType !== null) {
            requestBody.absentType = absentType
          }
          
          if (existingId) {
            // Update existing attendance
            const updateResponse = await fetch(`/api/attendance/${existingId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody)
            })
            if (updateResponse.ok) {
              successCount++
            } else {
              const errorData = await updateResponse.json().catch(() => ({}))
              console.error(`Error updating attendance for employee ${emp.id}:`, errorData.error || 'Unknown error')
            }
          } else {
            // Create new attendance
            const createBody = {
              employeeId: emp.id,
              date: selectedDate,
              ...requestBody
            }
            
            const response = await fetch('/api/attendance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(createBody)
            })
            if (response.ok) {
              successCount++
            } else {
              const errorData = await response.json().catch(() => ({}))
              console.error(`Error creating attendance for employee ${emp.id}:`, errorData.error || 'Unknown error')
            }
          }
        } catch (error) {
          console.error(`Error marking attendance for employee ${emp.id}:`, error)
        }
        
        // Add a small delay to prevent overwhelming the server
        if (emp !== deptEmployees[deptEmployees.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }

      alert(`تم تسجيل دوام ${successCount} من ${deptEmployees.length} موظف بنجاح`)
      setShowBulkModal(false)
      // Reload attendance
      const attResponse = await fetch(`/api/attendance?date=${selectedDate}`)
      if (attResponse.ok) {
        const attResult = await attResponse.json()
        setAttendance(attResult.data || [])
      }
    } catch (error) {
      console.error('Error marking bulk attendance:', error)
      alert('حدث خطأ في تسجيل الدوام')
    }
  }

  const handleMultiDayAttendance = async () => {
    if (!multiDayEmployeeId || !multiDayStartDate || !multiDayEndDate) {
      alert('يرجى إدخال جميع البيانات المطلوبة')
      return
    }

    const start = new Date(multiDayStartDate)
    const end = new Date(multiDayEndDate)

    if (start > end) {
      alert('تاريخ البداية يجب أن يكون قبل تاريخ النهاية')
      return
    }

    if (!confirm(`هل أنت متأكد من تسجيل الدوام لـ ${previewDaysCount} يوم؟`)) {
      return
    }

    try {
      // Handle status format
      let status = multiDayStatus
      let absentType = null
      if (multiDayStatus === 'absent_with_notice') {
        status = 'absent'
        absentType = 'with_notice'
      } else if (multiDayStatus === 'absent_without_notice') {
        status = 'absent'
        absentType = 'without_notice'
      }
      
      // Use batch endpoint for faster processing
      const batchRequestBody = {
        employeeId: parseInt(multiDayEmployeeId),
        startDate: multiDayStartDate,
        endDate: multiDayEndDate,
        status: status,
        excludeWeekends: excludeWeekends
      }
      
      if (absentType !== null) {
        batchRequestBody.absentType = absentType
      }
      
      const response = await fetch('/api/attendance/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchRequestBody)
      })
      
      if (response.ok) {
        const result = await response.json()
        const successCount = result.successCount || 0
        const skipCount = result.skipCount || 0
        const failedCount = result.failedCount || 0

        // Clear form
        setMultiDayEmployeeId('')
        setMultiDayStartDate('')
        setMultiDayEndDate('')
        setMultiDayStatus('present')
        setExcludeWeekends(false)
        setShowMultiDayModal(false)

        let message = `تم تسجيل ${successCount} يوم بنجاح`
        if (skipCount > 0) {
          message += ` (تم تخطي ${skipCount} يوم - عطلة نهاية الأسبوع)`
        }
        if (failedCount > 0) {
          message += ` (تعذر تسجيل ${failedCount} يوم - تحقق من تاريخ التعيين أو الإيقاف/إنهاء الخدمة)`
        }
        alert(message)

        // Reload attendance if current date is in range
        const today = new Date().toISOString().split('T')[0]
        if (today >= multiDayStartDate && today <= multiDayEndDate) {
          const attResponse = await fetch(`/api/attendance?date=${selectedDate}`)
          if (attResponse.ok) {
            const attResult = await attResponse.json()
            setAttendance(attResult.data || [])
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        alert(errorData.error || 'حدث خطأ في تسجيل الدوام')
      }
    } catch (error) {
      console.error('Error marking multiple days:', error)
      alert('حدث خطأ في تسجيل الدوام')
    }
  }

  const handleSelectAttendance = async () => {
    if (selectedEmployees.size === 0 || !selectedDate) {
      alert('يرجى اختيار موظفين على الأقل والتاريخ')
      return
    }

    if (!confirm(`هل تريد تسجيل دوام ${selectedEmployees.size} موظف؟`)) {
      return
    }

    try {
      // Handle status format
      let status = attendanceStatus
      let absentType = null
      if (attendanceStatus === 'absent_with_notice') {
        status = 'absent'
        absentType = 'with_notice'
      } else if (attendanceStatus === 'absent_without_notice') {
        status = 'absent'
        absentType = 'without_notice'
      }
      
      let successCount = 0
      for (const empId of selectedEmployees) {
        try {
          // Check if attendance already exists first
          const checkResponse = await fetch(`/api/attendance?employeeId=${empId}&date=${selectedDate}`)
          let existingId = null
          
          if (checkResponse.ok) {
            const checkData = await checkResponse.json()
            if (checkData.data && checkData.data.length > 0) {
              existingId = checkData.data[0].id
            }
          }
          
          // Build request body - only include absentType if it's not null
          const requestBody = {
            status: status
          }
          if (absentType !== null) {
            requestBody.absentType = absentType
          }
          
          if (existingId) {
            // Update existing attendance
            const updateResponse = await fetch(`/api/attendance/${existingId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody)
            })
            if (updateResponse.ok) {
              successCount++
            } else {
              const errorData = await updateResponse.json().catch(() => ({}))
              console.error(`Error updating attendance for employee ${empId}:`, errorData.error || 'Unknown error')
            }
          } else {
            // Create new attendance
            const createBody = {
              employeeId: parseInt(empId),
              date: selectedDate,
              ...requestBody
            }
            
            const response = await fetch('/api/attendance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(createBody)
            })
            if (response.ok) {
              successCount++
            } else {
              const errorData = await response.json().catch(() => ({}))
              console.error(`Error creating attendance for employee ${empId}:`, errorData.error || 'Unknown error')
            }
          }
        } catch (error) {
          console.error(`Error marking attendance for employee ${empId}:`, error)
        }
        
        // Add a small delay to prevent overwhelming the server
        const empArray = Array.from(selectedEmployees)
        if (empId !== empArray[empArray.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }

      alert(`تم تسجيل دوام ${successCount} موظف بنجاح`)
      setSelectedEmployees(new Set())
      setShowSelectModal(false)
      // Reload attendance
      const attResponse = await fetch(`/api/attendance?date=${selectedDate}`)
      if (attResponse.ok) {
        const attResult = await attResponse.json()
        setAttendance(attResult.data || [])
      }
    } catch (error) {
      console.error('Error marking selected attendance:', error)
      alert('حدث خطأ في تسجيل الدوام')
    }
  }

  const toggleEmployeeSelection = (empId) => {
    const newSet = new Set(selectedEmployees)
    if (newSet.has(empId)) {
      newSet.delete(empId)
    } else {
      newSet.add(empId)
    }
    setSelectedEmployees(newSet)
  }

  const updateAttendanceStatus = async (attendanceId, newStatus, absentType = null) => {
    try {
      const updateData = { status: newStatus }
      // Only include absentType if status is 'absent'
      if (newStatus === 'absent') {
        updateData.absentType = absentType || 'with_notice'
      }
      // Don't include absentType for other statuses
      
      const response = await fetch(`/api/attendance/${attendanceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        // Reload attendance
        const attResponse = await fetch(`/api/attendance?date=${selectedDate}`)
        if (attResponse.ok) {
          const attResult = await attResponse.json()
          setAttendance(attResult.data || [])
        }
      } else {
        const error = await response.json()
        alert(error.error || 'حدث خطأ في تحديث الحضور')
      }
    } catch (error) {
      console.error('Error updating attendance:', error)
      alert('حدث خطأ في تحديث الحضور')
    }
  }

  const updateAttendanceField = async (attendanceId, field, value) => {
    try {
      const updateData = { [field]: value }
      
      const response = await fetch(`/api/attendance/${attendanceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        // Update local state immediately for better UX
        setAttendance(prev => prev.map(att => 
          att.id === attendanceId 
            ? { ...att, [field]: field === 'overtimeHours' ? parseFloat(value) || 0 : parseInt(value) || 0 }
            : att
        ))
      } else {
        const error = await response.json()
        alert(error.error || 'حدث خطأ في تحديث الحضور')
        // Reload on error
        const attResponse = await fetch(`/api/attendance?date=${selectedDate}`)
        if (attResponse.ok) {
          const attResult = await attResponse.json()
          setAttendance(attResult.data || [])
        }
      }
    } catch (error) {
      console.error('Error updating attendance field:', error)
      alert('حدث خطأ في تحديث الحضور')
      // Reload on error
      const attResponse = await fetch(`/api/attendance?date=${selectedDate}`)
      if (attResponse.ok) {
        const attResult = await attResponse.json()
        setAttendance(attResult.data || [])
      }
    }
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>جاري التحميل...</p>
        </div>
      </Layout>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 768px) {
          .attendance-container {
            width: 100% !important;
            max-width: 100% !important;
          }
          .attendance-buttons-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
        @media (max-width: 767px) {
          .attendance-buttons-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .attendance-buttons-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />
      <Layout>
        <div 
          className="attendance-container"
          style={{
            background: 'white',
            borderRadius: '8px',
            padding: '40px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            width: '100%',
            maxWidth: '100%',
            margin: '0',
            boxSizing: 'border-box',
            minHeight: 'calc(100vh - 300px)'
          }}
        >
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          marginBottom: '32px',
          color: '#333'
        }}>
          تسجيل الدوام
        </h1>

        {/* Date Selection */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '12px', 
            fontWeight: '600',
            fontSize: '16px',
            color: '#333'
          }}>
            تاريخ الدوام:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '14px 18px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '17px',
              width: '100%',
              maxWidth: '350px',
              cursor: 'pointer',
              minHeight: '50px'
            }}
          />
        </div>

        {/* Action Buttons */}
        <div 
          className="attendance-buttons-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
            marginBottom: '40px',
            width: '100%'
          }}
        >
          <button
            onClick={() => setShowIndividualModal(true)}
            style={{
              padding: '18px 28px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '17px',
              fontWeight: '600',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              minHeight: '60px'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#5568d3'
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#667eea'
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            تسجيل فردي
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            style={{
              padding: '18px 28px',
              background: '#11998e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '17px',
              fontWeight: '600',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              minHeight: '60px'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#0d7a71'
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#11998e'
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            تسجيل جماعي (حسب القسم)
          </button>
          <button
            onClick={() => setShowMultiDayModal(true)}
            style={{
              padding: '18px 28px',
              background: '#f093fb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '17px',
              fontWeight: '600',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              minHeight: '60px'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#e67ee8'
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#f093fb'
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            تسجيل عدة أيام دفعة واحدة
          </button>
          <button
            onClick={() => setShowSelectModal(true)}
            style={{
              padding: '18px 28px',
              background: '#4facfe',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '17px',
              fontWeight: '600',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              minHeight: '60px'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#2d8fe8'
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#4facfe'
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            اختيار متعدد
          </button>
        </div>

        {/* Attendance Status Selector */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '12px', 
            fontWeight: '600',
            fontSize: '16px',
            color: '#333'
          }}>
            حالة الدوام الافتراضية:
          </label>
          <select
            value={attendanceStatus}
            onChange={(e) => setAttendanceStatus(e.target.value)}
            style={{
              padding: '14px 18px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '17px',
              width: '100%',
              maxWidth: '350px',
              cursor: 'pointer',
              background: 'white',
              minHeight: '50px'
            }}
          >
            <option value="present">حاضر</option>
            <option value="absent_with_notice">غياب (بتبليغ)</option>
            <option value="absent_without_notice">غياب (بدون تبليغ)</option>
            <option value="leave">إجازة</option>
            <option value="holiday">عطلة</option>
          </select>
        </div>

        {/* Attendance List */}
        <h2 style={{ 
          fontSize: '24px', 
          marginBottom: '24px',
          fontWeight: '600',
          color: '#333'
        }}>
          دوام {selectedDate}
        </h2>
        
        {attendance.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 40px',
            color: '#666',
            fontSize: '18px'
          }}>
            <p>لا يوجد دوام مسجل لهذا التاريخ</p>
          </div>
        ) : (
          <div style={{ 
            overflowX: 'auto',
            width: '100%',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '1000px'
            }}>
              <thead>
                <tr style={{
                  background: '#f8f9fa',
                  borderBottom: '2px solid #ddd'
                }}>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    fontSize: '15px',
                    color: '#333'
                  }}>الرقم الوظيفي</th>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    fontSize: '15px',
                    color: '#333'
                  }}>الاسم</th>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    fontSize: '15px',
                    color: '#333'
                  }}>الفرع</th>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    fontSize: '15px',
                    color: '#333'
                  }}>القسم</th>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    fontSize: '15px',
                    color: '#333'
                  }}>الحالة</th>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    fontSize: '15px',
                    color: '#333'
                  }}>ساعات إضافية</th>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    fontSize: '15px',
                    color: '#333'
                  }}>تأخير زمني (دقائق)</th>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    fontSize: '15px',
                    color: '#333'
                  }}>تأخير غير زمني (دقائق)</th>
                  <th style={{ 
                    padding: '16px', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    fontSize: '15px',
                    color: '#333'
                  }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((att) => {
                  // Determine the display value for status dropdown
                  const getStatusValue = () => {
                    if (att.status === 'absent') {
                      return att.absentType === 'without_notice' ? 'absent_without_notice' : 'absent_with_notice'
                    }
                    return att.status
                  }
                  
                  const getStatusText = () => {
                    if (att.status === 'present') return 'حاضر'
                    if (att.status === 'absent' && att.absentType === 'without_notice') return 'غياب (بدون تبليغ)'
                    if (att.status === 'absent') return 'غياب (بتبليغ)'
                    if (att.status === 'leave') return 'إجازة'
                    if (att.status === 'holiday') return 'عطلة'
                    return att.status
                  }
                  
                  return (
                    <tr key={att.id} style={{
                      borderBottom: '1px solid #eee',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8f9fa'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white'
                    }}
                    >
                      <td style={{ 
                        padding: '16px',
                        fontSize: '15px'
                      }}>{att.employee?.employeeNumber}</td>
                      <td style={{ 
                        padding: '16px',
                        fontSize: '15px',
                        fontWeight: '500'
                      }}>{att.employee?.name}</td>
                      <td style={{ 
                        padding: '16px',
                        fontSize: '15px'
                      }}>{att.employee?.branch || '-'}</td>
                      <td style={{ 
                        padding: '16px',
                        fontSize: '15px'
                      }}>{att.employee?.department}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '6px 14px',
                          borderRadius: '16px',
                          fontSize: '14px',
                          fontWeight: '500',
                          background: att.status === 'present' ? '#d4edda' : 
                                     att.status === 'absent' ? '#f8d7da' : 
                                     att.status === 'leave' ? '#fff3cd' : '#e2e3e5',
                          color: att.status === 'present' ? '#155724' : 
                                att.status === 'absent' ? '#721c24' : 
                                att.status === 'leave' ? '#856404' : '#383d41'
                        }}>
                          {getStatusText()}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={att.overtimeHours || 0}
                          onChange={(e) => updateAttendanceField(att.id, 'overtimeHours', e.target.value)}
                          style={{
                            width: '100px',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px',
                            textAlign: 'center'
                          }}
                        />
                      </td>
                      <td style={{ padding: '16px' }}>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={att.timeDelayMinutes || 0}
                          onChange={(e) => updateAttendanceField(att.id, 'timeDelayMinutes', e.target.value)}
                          style={{
                            width: '100px',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px',
                            textAlign: 'center'
                          }}
                        />
                      </td>
                      <td style={{ padding: '16px' }}>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={att.nonTimeDelayMinutes || 0}
                          onChange={(e) => updateAttendanceField(att.id, 'nonTimeDelayMinutes', e.target.value)}
                          style={{
                            width: '100px',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px',
                            textAlign: 'center'
                          }}
                        />
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <select
                            value={getStatusValue()}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === 'absent_with_notice') {
                                updateAttendanceStatus(att.id, 'absent', 'with_notice')
                              } else if (value === 'absent_without_notice') {
                                updateAttendanceStatus(att.id, 'absent', 'without_notice')
                              } else {
                                updateAttendanceStatus(att.id, value, null)
                              }
                            }}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #ddd',
                              borderRadius: '6px',
                              fontSize: '14px',
                              minWidth: '160px',
                              cursor: 'pointer',
                              background: 'white'
                            }}
                          >
                            <option value="present">حاضر</option>
                            <option value="absent_with_notice">غياب (بتبليغ)</option>
                            <option value="absent_without_notice">غياب (بدون تبليغ)</option>
                            <option value="leave">إجازة</option>
                            <option value="holiday">عطلة</option>
                          </select>
                          <button
                            onClick={() => {
                              if (confirm('هل تريد حذف سجل الدوام هذا؟')) {
                                fetch(`/api/attendance/${att.id}`, { method: 'DELETE' })
                                  .then(() => {
                                    const attResponse = fetch(`/api/attendance?date=${selectedDate}`)
                                      .then(r => r.json())
                                      .then(result => setAttendance(result.data || []))
                                  })
                              }
                            }}
                            style={{
                              padding: '8px 16px',
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '500',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = '#c82333'
                              e.target.style.transform = 'translateY(-1px)'
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = '#dc3545'
                              e.target.style.transform = 'translateY(0)'
                            }}
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Individual Attendance Modal */}
        {showIndividualModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%'
            }}>
              <h2 style={{ marginBottom: '16px' }}>تسجيل دوام فردي</h2>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>الموظف:</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px'
                  }}
                >
                  <option value="">اختر الموظف</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeNumber} - {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowIndividualModal(false)}
                  style={{
                    padding: '10px 20px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleIndividualAttendance}
                  style={{
                    padding: '10px 20px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  تسجيل
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Attendance Modal */}
        {showBulkModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%'
            }}>
              <h2 style={{ marginBottom: '16px' }}>تسجيل دوام جماعي</h2>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>القسم:</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px'
                  }}
                >
                  <option value="">اختر القسم</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {selectedDepartment && (
                  <p style={{ marginTop: '8px', color: '#666', fontSize: '14px' }}>
                    عدد الموظفين: {employees.filter(emp => emp.department === selectedDepartment).length}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowBulkModal(false)}
                  style={{
                    padding: '10px 20px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleBulkAttendance}
                  style={{
                    padding: '10px 20px',
                    background: '#11998e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  تسجيل
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Multiple Days Modal */}
        {showMultiDayModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%'
            }}>
              <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>تسجيل عدة أيام دفعة واحدة</h2>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>اختر الموظف:</label>
                <select
                  value={multiDayEmployeeId}
                  onChange={(e) => setMultiDayEmployeeId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">-- اختر موظف</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeNumber} - {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>من تاريخ:</label>
                  <input
                    type="date"
                    value={multiDayStartDate}
                    onChange={(e) => setMultiDayStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>إلى تاريخ:</label>
                  <input
                    type="date"
                    value={multiDayEndDate}
                    onChange={(e) => setMultiDayEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>الحالة:</label>
                <select
                  value={multiDayStatus}
                  onChange={(e) => setMultiDayStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="present">حاضر</option>
                  <option value="absent_with_notice">غياب (بتبليغ)</option>
                  <option value="absent_without_notice">غياب (بدون تبليغ)</option>
                  <option value="leave">إجازة</option>
                  <option value="holiday">عطلة</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  gap: '8px'
                }}>
                  <input
                    type="checkbox"
                    checked={excludeWeekends}
                    onChange={(e) => setExcludeWeekends(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontSize: '14px' }}>
                    استثناء عطلة نهاية الأسبوع (الجمعة والسبت)
                  </span>
                </label>
              </div>

              {previewDaysCount > 0 && (
                <div style={{
                  background: '#e7f3ff',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: 0, color: '#0066cc', fontWeight: '600' }}>
                    عدد الأيام: {previewDaysCount} يوم
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowMultiDayModal(false)
                    setMultiDayEmployeeId('')
                    setMultiDayStartDate('')
                    setMultiDayEndDate('')
                    setMultiDayStatus('present')
                    setExcludeWeekends(false)
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleMultiDayAttendance}
                  style={{
                    padding: '10px 20px',
                    background: '#f093fb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  تسجيل الأيام المحددة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Select Multiple Modal */}
        {showSelectModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <h2 style={{ marginBottom: '16px' }}>اختيار متعدد</h2>
              <div style={{ marginBottom: '16px', maxHeight: '400px', overflow: 'auto' }}>
                {employees.map(emp => (
                  <label key={emp.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedEmployees.has(emp.id)}
                      onChange={() => toggleEmployeeSelection(emp.id)}
                      style={{ marginLeft: '8px' }}
                    />
                    <span>{emp.employeeNumber} - {emp.name} ({emp.department})</span>
                  </label>
                ))}
              </div>
              <p style={{ marginBottom: '16px', color: '#666' }}>
                تم اختيار {selectedEmployees.size} موظف
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowSelectModal(false)
                    setSelectedEmployees(new Set())
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSelectAttendance}
                  style={{
                    padding: '10px 20px',
                    background: '#4facfe',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  تسجيل ({selectedEmployees.size})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
    </>
  )
}
