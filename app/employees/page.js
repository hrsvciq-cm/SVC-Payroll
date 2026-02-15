'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Layout from '@/app/components/Layout'
import { formatCurrency } from '@/lib/currency'

export default function EmployeesPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('active') // 'active', 'suspended', 'terminated'
  const [showAddModal, setShowAddModal] = useState(false)
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [changingStatusEmployee, setChangingStatusEmployee] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    employeeNumber: '',
    branch: '',
    department: '',
    position: '',
    salary: '',
    workHours: '8',
    hireDate: new Date().toISOString().split('T')[0],
    status: 'active',
    statusChangeDate: new Date().toISOString().split('T')[0],
    suspensionType: '',
    suspensionDate: '',
    terminationDate: ''
  })

  // Change status form state
  const [statusFormData, setStatusFormData] = useState({
    status: 'active',
    statusChangeDate: new Date().toISOString().split('T')[0],
    suspensionType: '',
    suspensionDate: '',
    terminationDate: ''
  })

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      try {
        const response = await fetch('/api/employees?includeTerminated=true')
        if (response.ok) {
          const result = await response.json()
          setEmployees(result.data || [])
        }
      } catch (error) {
        console.error('Error loading employees:', error)
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [router])

  const handleOpenModal = () => {
    const today = new Date().toISOString().split('T')[0]
    // Reset form
    setFormData({
      name: '',
      employeeNumber: '',
      branch: '',
      department: '',
      position: '',
      salary: '',
      workHours: '8',
      hireDate: today,
      status: 'active',
      statusChangeDate: today,
      suspensionType: '',
      suspensionDate: '',
      terminationDate: ''
    })
    setEditingEmployee(null)
    setShowAddModal(true)
  }

  const handleEdit = async (employee) => {
    try {
      // Fetch full employee data
      const response = await fetch(`/api/employees/${employee.id}`)
      if (response.ok) {
        const result = await response.json()
        const emp = result.data
        
        // Format dates for input fields
        const formatDate = (date) => {
          if (!date) return ''
          return new Date(date).toISOString().split('T')[0]
        }
        
        setFormData({
          name: emp.name || '',
          employeeNumber: emp.employeeNumber || '',
          branch: emp.branch || '',
          department: emp.department || '',
          position: emp.position || '',
          salary: emp.salary?.toString() || '',
          workHours: emp.workHours?.toString() || '8',
          hireDate: formatDate(emp.hireDate),
          status: emp.status || 'active',
          statusChangeDate: formatDate(emp.statusChangeDate) || formatDate(emp.hireDate) || new Date().toISOString().split('T')[0],
          suspensionType: emp.suspensionType || '',
          suspensionDate: formatDate(emp.suspensionDate),
          terminationDate: formatDate(emp.terminationDate)
        })
        setEditingEmployee(emp)
        setShowAddModal(true)
      } else {
        alert('حدث خطأ في جلب بيانات الموظف')
      }
    } catch (error) {
      console.error('Error loading employee:', error)
      alert('حدث خطأ في جلب بيانات الموظف')
    }
  }

  const handleChangeStatus = (employee) => {
    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).toISOString().split('T')[0]
    }
    
    setStatusFormData({
      status: employee.status || 'active',
      statusChangeDate: formatDate(employee.statusChangeDate) || new Date().toISOString().split('T')[0],
      suspensionType: employee.suspensionType || '',
      suspensionDate: formatDate(employee.suspensionDate),
      terminationDate: formatDate(employee.terminationDate)
    })
    setChangingStatusEmployee(employee)
    setShowChangeStatusModal(true)
  }

  const handleDelete = async (employee) => {
    if (!confirm(`هل أنت متأكد من حذف الموظف "${employee.name}"؟\n\nملاحظة: لا يمكن حذف الموظفين المنتهية خدمتهم.`)) {
      return
    }

    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('تم حذف الموظف بنجاح')
        // Reload employees
        const empResponse = await fetch('/api/employees?includeTerminated=true')
        if (empResponse.ok) {
          const empResult = await empResponse.json()
          setEmployees(empResult.data || [])
        }
      } else {
        const error = await response.json()
        alert(error.error || 'حدث خطأ في حذف الموظف')
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      alert('حدث خطأ في حذف الموظف')
    }
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingEmployee(null)
  }

  const handleCloseStatusModal = () => {
    setShowChangeStatusModal(false)
    setChangingStatusEmployee(null)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    const updatedData = {
      ...formData,
      [name]: value
    }
    
    // When status changes, update statusChangeDate to today
    if (name === 'status') {
      updatedData.statusChangeDate = new Date().toISOString().split('T')[0]
      
      // Clear conditional fields when status changes
      if (value !== 'suspended') {
        updatedData.suspensionType = ''
        updatedData.suspensionDate = ''
      }
      if (value !== 'terminated') {
        updatedData.terminationDate = ''
      }
    }
    
    // When hireDate changes and status is active, update statusChangeDate
    if (name === 'hireDate' && formData.status === 'active') {
      updatedData.statusChangeDate = value
    }
    
    setFormData(updatedData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.employeeNumber || !formData.salary) {
      alert('يرجى إدخال جميع البيانات المطلوبة (الاسم، الرقم الوظيفي، الراتب)')
      return
    }

    if (isNaN(parseFloat(formData.salary)) || parseFloat(formData.salary) <= 0) {
      alert('يرجى إدخال راتب صحيح')
      return
    }

    // Validate status-specific fields
    if (formData.status === 'suspended') {
      if (!formData.suspensionDate) {
        alert('يرجى إدخال تاريخ الإيقاف')
        return
      }
      if (!formData.suspensionType) {
        alert('يرجى اختيار نوع الإيقاف')
        return
      }
    }

    if (formData.status === 'terminated') {
      if (!formData.terminationDate) {
        alert('يرجى إدخال تاريخ إنهاء الخدمة')
        return
      }
    }

    if (!formData.statusChangeDate) {
      alert('يرجى إدخال تاريخ تغيير الحالة')
      return
    }

    setSubmitting(true)

    try {
      const employeeData = {
        name: formData.name,
        employeeNumber: formData.employeeNumber,
        branch: formData.branch || '',
        department: formData.department || '',
        position: formData.position || '',
        salary: parseFloat(formData.salary),
        workHours: parseFloat(formData.workHours) || 8,
        hireDate: formData.hireDate || null,
        status: formData.status || 'active',
        statusChangeDate: formData.statusChangeDate || formData.hireDate || new Date().toISOString().split('T')[0],
        suspensionType: formData.status === 'suspended' ? formData.suspensionType : null,
        suspensionDate: formData.status === 'suspended' && formData.suspensionDate ? formData.suspensionDate : null,
        terminationDate: formData.status === 'terminated' && formData.terminationDate ? formData.terminationDate : null
      }

      let response
      if (editingEmployee) {
        // Update existing employee
        response = await fetch(`/api/employees/${editingEmployee.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(employeeData)
        })
      } else {
        // Create new employee
        response = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(employeeData)
        })
      }

      if (response.ok) {
        const result = await response.json()
        alert(editingEmployee ? 'تم تحديث بيانات الموظف بنجاح' : 'تم إضافة الموظف بنجاح')
        handleCloseModal()
        
        // Reload employees
        const empResponse = await fetch('/api/employees?includeTerminated=true')
        if (empResponse.ok) {
          const empResult = await empResponse.json()
          setEmployees(empResult.data || [])
        }
      } else {
        const error = await response.json()
        alert(error.error || (editingEmployee ? 'حدث خطأ في تحديث الموظف' : 'حدث خطأ في إضافة الموظف'))
      }
    } catch (error) {
      console.error('Error saving employee:', error)
      alert(editingEmployee ? 'حدث خطأ في تحديث الموظف' : 'حدث خطأ في إضافة الموظف')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusInputChange = (e) => {
    const { name, value } = e.target
    const updatedData = {
      ...statusFormData,
      [name]: value
    }
    
    // When status changes, update statusChangeDate to today
    if (name === 'status') {
      updatedData.statusChangeDate = new Date().toISOString().split('T')[0]
      
      // Clear conditional fields when status changes
      if (value !== 'suspended') {
        updatedData.suspensionType = ''
        updatedData.suspensionDate = ''
      }
      if (value !== 'terminated') {
        updatedData.terminationDate = ''
      }
    }
    
    setStatusFormData(updatedData)
  }

  const handleStatusSubmit = async (e) => {
    e.preventDefault()
    
    if (!changingStatusEmployee) return

    // Validate status-specific fields
    if (statusFormData.status === 'suspended') {
      if (!statusFormData.suspensionDate) {
        alert('يرجى إدخال تاريخ الإيقاف')
        return
      }
      if (!statusFormData.suspensionType) {
        alert('يرجى اختيار نوع الإيقاف')
        return
      }
    }

    if (statusFormData.status === 'terminated') {
      if (!statusFormData.terminationDate) {
        alert('يرجى إدخال تاريخ إنهاء الخدمة')
        return
      }
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/employees/${changingStatusEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusFormData.status,
          statusChangeDate: statusFormData.statusChangeDate,
          suspensionType: statusFormData.status === 'suspended' ? statusFormData.suspensionType : null,
          suspensionDate: statusFormData.status === 'suspended' && statusFormData.suspensionDate ? statusFormData.suspensionDate : null,
          terminationDate: statusFormData.status === 'terminated' && statusFormData.terminationDate ? statusFormData.terminationDate : null
        })
      })

      if (response.ok) {
        alert('تم تغيير حالة الموظف بنجاح')
        setShowChangeStatusModal(false)
        setChangingStatusEmployee(null)
        
        // Reload employees
        const empResponse = await fetch('/api/employees?includeTerminated=true')
        if (empResponse.ok) {
          const empResult = await empResponse.json()
          setEmployees(empResult.data || [])
        }
      } else {
        const error = await response.json()
        alert(error.error || 'حدث خطأ في تغيير حالة الموظف')
      }
    } catch (error) {
      console.error('Error changing status:', error)
      alert('حدث خطأ في تغيير حالة الموظف')
    } finally {
      setSubmitting(false)
    }
  }

  const getFilteredEmployees = () => {
    let filtered = employees

    // Filter by tab
    if (activeTab === 'active') {
      filtered = filtered.filter(emp => emp.status === 'active')
    } else if (activeTab === 'suspended') {
      filtered = filtered.filter(emp => emp.status === 'suspended')
    } else if (activeTab === 'terminated') {
      filtered = filtered.filter(emp => emp.status === 'terminated')
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(emp =>
        emp.name?.toLowerCase().includes(search) ||
        emp.employeeNumber?.toLowerCase().includes(search) ||
        emp.department?.toLowerCase().includes(search)
      )
    }

    return filtered
  }

  const filteredEmployees = getFilteredEmployees()

  const activeCount = employees.filter(emp => emp.status === 'active').length
  const suspendedCount = employees.filter(emp => emp.status === 'suspended').length
  const terminatedCount = employees.filter(emp => emp.status === 'terminated').length

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
    <Layout>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: 'clamp(16px, 3vw, 24px)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: '1920px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'clamp(16px, 3vw, 24px)',
          flexWrap: 'wrap',
          gap: 'clamp(12px, 2vw, 16px)'
        }}>
          <h1 style={{ 
            fontSize: 'clamp(20px, 5vw, 28px)', 
            fontWeight: 'bold',
            color: '#333',
            margin: 0
          }}>
            إدارة الموظفين
          </h1>
          <button
            onClick={handleOpenModal}
            style={{
              padding: 'clamp(8px, 1.5vw, 10px) clamp(16px, 3vw, 20px)',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              fontWeight: '600',
              whiteSpace: 'nowrap'
            }}
          >
            إضافة موظف جديد
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 'clamp(4px, 1vw, 8px)',
          marginBottom: 'clamp(16px, 3vw, 24px)',
          borderBottom: '2px solid #eee',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 24px)',
              background: activeTab === 'active' ? '#667eea' : 'transparent',
              color: activeTab === 'active' ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === 'active' ? '2px solid #667eea' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              fontWeight: '600',
              marginBottom: '-2px',
              whiteSpace: 'nowrap'
            }}
          >
            نشط ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab('suspended')}
            style={{
              padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 24px)',
              background: activeTab === 'suspended' ? '#f093fb' : 'transparent',
              color: activeTab === 'suspended' ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === 'suspended' ? '2px solid #f093fb' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              fontWeight: '600',
              marginBottom: '-2px',
              whiteSpace: 'nowrap'
            }}
          >
            موقوف ({suspendedCount})
          </button>
          <button
            onClick={() => setActiveTab('terminated')}
            style={{
              padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 24px)',
              background: activeTab === 'terminated' ? '#dc3545' : 'transparent',
              color: activeTab === 'terminated' ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === 'terminated' ? '2px solid #dc3545' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 'clamp(12px, 2.5vw, 14px)',
              fontWeight: '600',
              marginBottom: '-2px',
              whiteSpace: 'nowrap'
            }}
          >
            منتهي الخدمة ({terminatedCount})
          </button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 'clamp(16px, 3vw, 20px)' }}>
          <input
            type="text"
            placeholder="بحث عن موظف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '100%',
              padding: 'clamp(8px, 1.5vw, 10px)',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: 'clamp(12px, 2.5vw, 14px)'
            }}
          />
        </div>

        {filteredEmployees.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#666'
          }}>
            <p>لا توجد موظفين في هذه الفئة</p>
          </div>
        ) : (
          <div className="table-responsive" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '800px'
            }}>
              <thead>
                <tr style={{
                  background: '#f8f9fa',
                  borderBottom: '2px solid #ddd'
                }}>
                  <th style={{ 
                    padding: 'clamp(8px, 1.5vw, 12px)', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    fontSize: 'clamp(12px, 2.5vw, 14px)'
                  }}>الرقم الوظيفي</th>
                  <th style={{ 
                    padding: 'clamp(8px, 1.5vw, 12px)', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    fontSize: 'clamp(12px, 2.5vw, 14px)'
                  }}>الاسم</th>
                  <th style={{ 
                    padding: 'clamp(8px, 1.5vw, 12px)', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    fontSize: 'clamp(12px, 2.5vw, 14px)'
                  }}>القسم</th>
                  <th style={{ 
                    padding: 'clamp(8px, 1.5vw, 12px)', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    fontSize: 'clamp(12px, 2.5vw, 14px)'
                  }}>المسمى الوظيفي</th>
                  <th style={{ 
                    padding: 'clamp(8px, 1.5vw, 12px)', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    fontSize: 'clamp(12px, 2.5vw, 14px)'
                  }}>الراتب الأساسي</th>
                  <th style={{ 
                    padding: 'clamp(8px, 1.5vw, 12px)', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    fontSize: 'clamp(12px, 2.5vw, 14px)'
                  }}>الحالة</th>
                  <th style={{ 
                    padding: 'clamp(8px, 1.5vw, 12px)', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    fontSize: 'clamp(12px, 2.5vw, 14px)'
                  }}>تاريخ تغيير الحالة</th>
                  {activeTab === 'terminated' && (
                    <th style={{ 
                      padding: 'clamp(8px, 1.5vw, 12px)', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      fontSize: 'clamp(12px, 2.5vw, 14px)'
                    }}>تاريخ إنهاء الخدمة</th>
                  )}
                  {activeTab === 'suspended' && (
                    <th style={{ 
                      padding: 'clamp(8px, 1.5vw, 12px)', 
                      textAlign: 'right', 
                      fontWeight: '600',
                      fontSize: 'clamp(12px, 2.5vw, 14px)'
                    }}>تاريخ الإيقاف</th>
                  )}
                  <th style={{ 
                    padding: 'clamp(8px, 1.5vw, 12px)', 
                    textAlign: 'right', 
                    fontWeight: '600',
                    fontSize: 'clamp(12px, 2.5vw, 14px)'
                  }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} style={{
                    borderBottom: '1px solid #eee'
                  }}>
                    <td style={{ 
                      padding: 'clamp(8px, 1.5vw, 12px)',
                      fontSize: 'clamp(12px, 2.5vw, 14px)'
                    }}>{emp.employeeNumber}</td>
                    <td style={{ 
                      padding: 'clamp(8px, 1.5vw, 12px)',
                      fontSize: 'clamp(12px, 2.5vw, 14px)'
                    }}>{emp.name}</td>
                    <td style={{ 
                      padding: 'clamp(8px, 1.5vw, 12px)',
                      fontSize: 'clamp(12px, 2.5vw, 14px)'
                    }}>{emp.department}</td>
                    <td style={{ 
                      padding: 'clamp(8px, 1.5vw, 12px)',
                      fontSize: 'clamp(12px, 2.5vw, 14px)'
                    }}>{emp.position}</td>
                    <td style={{ 
                      padding: 'clamp(8px, 1.5vw, 12px)',
                      fontSize: 'clamp(12px, 2.5vw, 14px)'
                    }}>{formatCurrency(emp.salary)}</td>
                    <td style={{ 
                      padding: 'clamp(8px, 1.5vw, 12px)',
                      fontSize: 'clamp(12px, 2.5vw, 14px)'
                    }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: 'clamp(10px, 2vw, 12px)',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        background: emp.status === 'active' ? '#d4edda' : emp.status === 'suspended' ? '#fff3cd' : '#f8d7da',
                        color: emp.status === 'active' ? '#155724' : emp.status === 'suspended' ? '#856404' : '#721c24'
                      }}>
                        {emp.status === 'active' ? 'نشط' : emp.status === 'suspended' ? 'موقوف' : 'منتهي'}
                      </span>
                    </td>
                    <td style={{ 
                      padding: 'clamp(8px, 1.5vw, 12px)',
                      fontSize: 'clamp(12px, 2.5vw, 14px)'
                    }}>
                      {emp.statusChangeDate ? (
                        <span>من: {new Date(emp.statusChangeDate).toLocaleDateString('ar-IQ', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                      ) : '-'}
                    </td>
                    {activeTab === 'terminated' && (
                      <td style={{ 
                        padding: 'clamp(8px, 1.5vw, 12px)',
                        fontSize: 'clamp(12px, 2.5vw, 14px)'
                      }}>
                        {emp.terminationDate ? new Date(emp.terminationDate).toLocaleDateString('ar-IQ') : '-'}
                      </td>
                    )}
                    {activeTab === 'suspended' && (
                      <td style={{ 
                        padding: 'clamp(8px, 1.5vw, 12px)',
                        fontSize: 'clamp(12px, 2.5vw, 14px)'
                      }}>
                        {emp.suspensionDate ? new Date(emp.suspensionDate).toLocaleDateString('ar-IQ') : '-'}
                      </td>
                    )}
                    <td style={{ 
                      padding: 'clamp(8px, 1.5vw, 12px)',
                      fontSize: 'clamp(12px, 2.5vw, 14px)'
                    }}>
                      <div style={{ display: 'flex', gap: 'clamp(4px, 1vw, 8px)', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleEdit(emp)}
                          style={{
                            padding: 'clamp(4px, 0.8vw, 6px) clamp(8px, 1.5vw, 12px)',
                            background: '#667eea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: 'clamp(10px, 2vw, 12px)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleChangeStatus(emp)}
                          style={{
                            padding: 'clamp(4px, 0.8vw, 6px) clamp(8px, 1.5vw, 12px)',
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: 'clamp(10px, 2vw, 12px)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          تغيير الحالة
                        </button>
                        {emp.status !== 'terminated' && (
                          <button
                            onClick={() => handleDelete(emp)}
                            style={{
                              padding: 'clamp(4px, 0.8vw, 6px) clamp(8px, 1.5vw, 12px)',
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: 'clamp(10px, 2vw, 12px)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            حذف
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal()
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: 'clamp(20px, 4vw, 30px)',
              width: '100%',
              maxWidth: 'min(600px, 95vw)',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              margin: '0 clamp(10px, 2vw, 20px)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'clamp(16px, 3vw, 24px)'
            }}>
              <h2 style={{
                fontSize: 'clamp(18px, 4vw, 24px)',
                fontWeight: 'bold',
                color: '#333',
                margin: 0
              }}>
                {editingEmployee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
              </h2>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  الاسم الكامل:
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  الرقم الوظيفي:
                </label>
                <input
                  type="text"
                  name="employeeNumber"
                  value={formData.employeeNumber}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  الفرع:
                </label>
                <input
                  type="text"
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  القسم:
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  المسمى الوظيفي:
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  الراتب الأساسي الشهري:
                </label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <small style={{
                  color: '#666',
                  display: 'block',
                  marginTop: '5px',
                  fontSize: '12px'
                }}>
                  الراتب ثابت بغض النظر عن عدد أيام الشهر
                </small>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  ساعات العمل اليومية:
                </label>
                <input
                  type="number"
                  name="workHours"
                  value={formData.workHours}
                  onChange={handleInputChange}
                  step="0.5"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <small style={{
                  color: '#666',
                  display: 'block',
                  marginTop: '5px',
                  fontSize: '12px'
                }}>
                  عدد ساعات العمل اليومية (لحساب العمل الإضافي والتأخيرات)
                </small>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  تاريخ التعيين:
                </label>
                <input
                  type="date"
                  name="hireDate"
                  value={formData.hireDate}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <small style={{
                  color: '#666',
                  display: 'block',
                  marginTop: '5px',
                  fontSize: '12px'
                }}>
                  تاريخ بدء العمل (إلزامي)
                </small>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  الحالة:
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white'
                  }}
                >
                  <option value="active">نشط</option>
                  <option value="suspended">موقوف</option>
                  <option value="terminated">منتهي الخدمة</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  تاريخ تغيير الحالة:
                </label>
                <input
                  type="date"
                  name="statusChangeDate"
                  value={formData.statusChangeDate}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <small style={{
                  color: '#666',
                  display: 'block',
                  marginTop: '5px',
                  fontSize: '12px'
                }}>
                  تاريخ بدء الحالة الحالية (يتم ملؤه تلقائياً عند تغيير الحالة)
                </small>
              </div>

              {/* Suspension fields - shown only when status is suspended */}
              {formData.status === 'suspended' && (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      color: '#333'
                    }}>
                      نوع الإيقاف:
                    </label>
                    <select
                      name="suspensionType"
                      value={formData.suspensionType}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: 'white'
                      }}
                    >
                      <option value="">اختر نوع الإيقاف</option>
                      <option value="with_salary">براتب</option>
                      <option value="without_salary">بدون راتب</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      color: '#333'
                    }}>
                      تاريخ الإيقاف:
                    </label>
                    <input
                      type="date"
                      name="suspensionDate"
                      value={formData.suspensionDate}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </>
              )}

              {/* Termination fields - shown only when status is terminated */}
              {formData.status === 'terminated' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    تاريخ إنهاء الخدمة:
                  </label>
                  <input
                    type="date"
                    name="terminationDate"
                    value={formData.terminationDate}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              )}

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  style={{
                    padding: '10px 20px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 20px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  {submitting ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {showChangeStatusModal && changingStatusEmployee && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseStatusModal()
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '30px',
              width: '100%',
              maxWidth: '500px',
              position: 'relative',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#333',
                margin: 0
              }}>
                تغيير حالة الموظف: {changingStatusEmployee.name}
              </h2>
              <button
                onClick={handleCloseStatusModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleStatusSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  الحالة:
                </label>
                <select
                  name="status"
                  value={statusFormData.status}
                  onChange={handleStatusInputChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white'
                  }}
                >
                  <option value="active">نشط</option>
                  <option value="suspended">موقوف</option>
                  <option value="terminated">منتهي الخدمة</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  تاريخ تغيير الحالة:
                </label>
                <input
                  type="date"
                  name="statusChangeDate"
                  value={statusFormData.statusChangeDate}
                  onChange={handleStatusInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <small style={{
                  color: '#666',
                  display: 'block',
                  marginTop: '5px',
                  fontSize: '12px'
                }}>
                  تاريخ بدء الحالة الحالية (يتم ملؤه تلقائياً عند تغيير الحالة)
                </small>
              </div>

              {/* Suspension fields - shown only when status is suspended */}
              {statusFormData.status === 'suspended' && (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      color: '#333'
                    }}>
                      نوع الإيقاف:
                    </label>
                    <select
                      name="suspensionType"
                      value={statusFormData.suspensionType}
                      onChange={handleStatusInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: 'white'
                      }}
                    >
                      <option value="">اختر نوع الإيقاف</option>
                      <option value="with_salary">براتب</option>
                      <option value="without_salary">بدون راتب</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      color: '#333'
                    }}>
                      تاريخ الإيقاف:
                    </label>
                    <input
                      type="date"
                      name="suspensionDate"
                      value={statusFormData.suspensionDate}
                      onChange={handleStatusInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </>
              )}

              {/* Termination fields - shown only when status is terminated */}
              {statusFormData.status === 'terminated' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#333'
                  }}>
                    تاريخ إنهاء الخدمة:
                  </label>
                  <input
                    type="date"
                    name="terminationDate"
                    value={statusFormData.terminationDate}
                    onChange={handleStatusInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              )}

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={handleCloseStatusModal}
                  disabled={submitting}
                  style={{
                    padding: '10px 20px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 20px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  {submitting ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
