'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Layout from '@/app/components/Layout'
import { formatCurrency } from '@/lib/currency'

export default function PayrollPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [payroll, setPayroll] = useState([])
  
  // Modals state
  const [showAddDeductionModal, setShowAddDeductionModal] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [showPayslipModal, setShowPayslipModal] = useState(false)
  const [selectedPayroll, setSelectedPayroll] = useState(null)
  const [deductions, setDeductions] = useState([])
  const [submitting, setSubmitting] = useState(false)
  
  // Add deduction form state
  const [deductionForm, setDeductionForm] = useState({
    type: 'deduction',
    amount: '',
    description: ''
  })

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [router])

  useEffect(() => {
    if (selectedMonth) {
      loadPayroll()
    }
  }, [selectedMonth])

  const loadPayroll = async () => {
    try {
      const response = await fetch(`/api/payroll?month=${selectedMonth}`)
      if (response.ok) {
        const result = await response.json()
        setPayroll(result.data || [])
      }
    } catch (error) {
      console.error('Error loading payroll:', error)
    }
  }

  const handleCalculate = async () => {
    if (!confirm('هل تريد حساب الرواتب لهذا الشهر؟')) return
    
    try {
      const response = await fetch('/api/payroll/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth })
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(result.message || 'تم حساب الرواتب بنجاح')
        loadPayroll()
      } else {
        const errorData = await response.json().catch(() => ({}))
        alert(errorData.error || 'حدث خطأ في حساب الرواتب')
      }
    } catch (error) {
      console.error('Error calculating payroll:', error)
      alert('حدث خطأ في حساب الرواتب')
    }
  }

  const handleAddDeduction = (pay) => {
    setSelectedPayroll(pay)
    setDeductionForm({
      type: 'deduction',
      amount: '',
      description: ''
    })
    setShowAddDeductionModal(true)
  }

  const handleManage = async (pay) => {
    setSelectedPayroll(pay)
    try {
      const response = await fetch(`/api/deductions?employeeId=${pay.employeeId}&month=${selectedMonth}`)
      if (response.ok) {
        const result = await response.json()
        setDeductions(result.data || [])
        setShowManageModal(true)
      }
    } catch (error) {
      console.error('Error loading deductions:', error)
      alert('حدث خطأ في جلب البيانات')
    }
  }

  const handlePayslip = async (pay) => {
    setSelectedPayroll(pay)
    try {
      // Load full employee data
      const empResponse = await fetch(`/api/employees/${pay.employeeId}`)
      if (empResponse.ok) {
        const empResult = await empResponse.json()
        setSelectedPayroll({ ...pay, employee: empResult.data })
        
        // Load deductions
        const dedResponse = await fetch(`/api/deductions?employeeId=${pay.employeeId}&month=${selectedMonth}`)
        if (dedResponse.ok) {
          const dedResult = await dedResponse.json()
          setDeductions(dedResult.data || [])
        }
        
        setShowPayslipModal(true)
      }
    } catch (error) {
      console.error('Error loading payslip data:', error)
      alert('حدث خطأ في تحميل بيانات قسيمة الراتب')
    }
  }

  const handleSubmitDeduction = async (e) => {
    e.preventDefault()
    
    if (!deductionForm.amount || parseFloat(deductionForm.amount) <= 0) {
      alert('يرجى إدخال مبلغ صحيح')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/deductions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedPayroll.employeeId,
          month: selectedMonth,
          type: deductionForm.type,
          amount: parseFloat(deductionForm.amount),
          description: deductionForm.description || null
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message || 'تم الحفظ بنجاح')
        setShowAddDeductionModal(false)
        loadPayroll()
        
        // Recalculate payroll
        await fetch('/api/payroll/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ month: selectedMonth })
        })
        loadPayroll()
      } else {
        const error = await response.json()
        alert(error.error || 'حدث خطأ في الحفظ')
      }
    } catch (error) {
      console.error('Error saving deduction:', error)
      alert('حدث خطأ في الحفظ')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteDeduction = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return

    try {
      const response = await fetch(`/api/deductions/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('تم الحذف بنجاح')
        handleManage(selectedPayroll) // Reload deductions
        loadPayroll()
        
        // Recalculate payroll
        await fetch('/api/payroll/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ month: selectedMonth })
        })
        loadPayroll()
      } else {
        const error = await response.json()
        alert(error.error || 'حدث خطأ في الحذف')
      }
    } catch (error) {
      console.error('Error deleting deduction:', error)
      alert('حدث خطأ في الحذف')
    }
  }

  const handlePrintPayslip = () => {
    const printWindow = window.open('', '_blank')
    const payslipContent = document.getElementById('payslipContent')
    
    if (!payslipContent || !printWindow) {
      window.print()
      return
    }
    
    // Clone and clean content
    const content = payslipContent.cloneNode(true)
    
    // Extract all text content properly
    const headerDiv = content.querySelector('div:first-child')
    const infoDiv = content.querySelector('div:nth-child(2)')
    const sections = Array.from(content.querySelectorAll('div:nth-child(n+3)'))
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>قسيمة راتب</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', 'Tahoma', sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: #000;
            background: white;
            padding: 0;
            margin: 0;
            width: 100%;
          }
          
          .payslip-wrapper {
            width: 100%;
            max-width: 100%;
            padding: 0;
            margin: 0;
            background: white;
          }
          
          .payslip-header {
            text-align: center;
            margin-bottom: 8px;
            padding-bottom: 6px;
            border-bottom: 2px solid #667eea;
          }
          
          .payslip-header h2 {
            color: #667eea;
            font-size: 16px;
            margin-bottom: 3px;
            padding: 0;
            font-weight: bold;
          }
          
          .payslip-header p {
            font-size: 11px;
            color: #666;
            margin: 0;
            padding: 0;
          }
          
          .payslip-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 10px;
            font-size: 10px;
          }
          
          .payslip-info p {
            font-size: 10px;
            margin: 3px 0;
            line-height: 1.5;
            padding: 0;
          }
          
          .payslip-section {
            margin-bottom: 8px;
            page-break-inside: avoid;
          }
          
          .payslip-section h3 {
            font-size: 11px;
            margin-bottom: 4px;
            padding-bottom: 3px;
            border-bottom: 1px solid #ddd;
            color: #333;
            font-weight: bold;
          }
          
          .payslip-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            font-size: 10px;
            line-height: 1.4;
            border-bottom: 1px solid #f0f0f0;
            margin: 0;
          }
          
          .payslip-row span {
            word-wrap: break-word;
            overflow: visible;
          }
          
          .payslip-row span span {
            font-size: 9px;
            color: #666;
            margin-right: 5px;
          }
          
          .payslip-row.total {
            font-size: 13px;
            font-weight: bold;
            color: #667eea;
            padding: 6px 0;
            border-top: 2px solid #667eea;
            margin-top: 6px;
            border-bottom: none;
          }
          
          .payslip-footer {
            text-align: center;
            margin-top: 10px;
            padding-top: 6px;
            border-top: 2px solid #ddd;
            color: #666;
            font-size: 9px;
          }
          
          .payslip-footer p {
            font-size: 9px;
            margin: 2px 0;
            line-height: 1.4;
            padding: 0;
          }
          
          strong {
            font-weight: bold;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            
            .payslip-wrapper {
              page-break-after: avoid;
              page-break-inside: avoid;
            }
            
            .payslip-section {
              page-break-inside: avoid;
            }
            
            .payslip-row {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="payslip-wrapper">
          ${content.innerHTML}
        </div>
      </body>
      </html>
    `)
    
    printWindow.document.close()
    
    setTimeout(() => {
      printWindow.print()
    }, 300)
  }

  const formatMonth = (month) => {
    const [year, monthNum] = month.split('-')
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    return `${months[parseInt(monthNum) - 1]} ${year}`
  }

  const getTypeLabel = (type) => {
    const labels = {
      deduction: 'خصم',
      bonus: 'مكافأة',
      advance: 'سلفة'
    }
    return labels[type] || type
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
    <Layout>
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          
          body * {
            visibility: hidden;
          }
          
          #payslipContent,
          #payslipContent * {
            visibility: visible;
          }
          
          #payslipContent {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: white !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
          
          .payslip-modal-container {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            z-index: 99999 !important;
            overflow: visible !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          .payslip-modal-container > div:first-child {
            display: none !important;
          }
          
          button {
            display: none !important;
          }
          
          .payslip-header {
            margin-bottom: 8px !important;
            padding-bottom: 6px !important;
          }
          
          .payslip-header h2 {
            font-size: 16px !important;
            margin-bottom: 3px !important;
          }
          
          .payslip-header p {
            font-size: 11px !important;
            margin: 0 !important;
          }
          
          .payslip-info {
            margin-bottom: 10px !important;
            gap: 15px !important;
            font-size: 10px !important;
          }
          
          .payslip-info p {
            font-size: 10px !important;
            margin: 3px 0 !important;
            line-height: 1.5 !important;
          }
          
          .payslip-section {
            margin-bottom: 8px !important;
            page-break-inside: avoid !important;
          }
          
          .payslip-section h3 {
            font-size: 11px !important;
            margin-bottom: 4px !important;
            padding-bottom: 3px !important;
          }
          
          .payslip-row {
            padding: 3px 0 !important;
            font-size: 10px !important;
            line-height: 1.4 !important;
          }
          
          .payslip-row.total {
            font-size: 13px !important;
            padding: 6px 0 !important;
            margin-top: 6px !important;
          }
          
          .payslip-footer {
            margin-top: 10px !important;
            padding-top: 6px !important;
            font-size: 9px !important;
          }
          
          .payslip-footer p {
            font-size: 9px !important;
            margin: 2px 0 !important;
            line-height: 1.4 !important;
          }
        }
      `}</style>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold',
            color: '#333',
            margin: 0
          }}>
            الرواتب
          </h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', color: '#666' }}>
              اختر الشهر:
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <button
              onClick={handleCalculate}
              style={{
                padding: '10px 20px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              حساب الرواتب
            </button>
            {payroll.length > 0 && (
              <button
                onClick={() => {
                  window.open(`/payroll/print-all?month=${selectedMonth}`, '_blank')
                }}
                style={{
                  padding: '10px 20px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                طباعة كافة القسائم
              </button>
            )}
          </div>
        </div>

        {payroll.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#666'
          }}>
            <p>لا توجد بيانات رواتب لهذا الشهر</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              اضغط "حساب الرواتب" لإنشاء بيانات الرواتب
            </p>
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
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>الرقم الوظيفي</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>الاسم</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>أيام الحضور</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>الراتب الأساسي</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>الخصومات</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>المكافآت</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>السلف</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>صافي الراتب</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {payroll.map((pay) => (
                  <tr key={pay.id} style={{
                    borderBottom: '1px solid #eee'
                  }}>
                    <td style={{ padding: '12px' }}>{pay.employee?.employeeNumber}</td>
                    <td style={{ padding: '12px' }}>{pay.employee?.name}</td>
                    <td style={{ padding: '12px' }}>{pay.presentDays}</td>
                    <td style={{ padding: '12px' }}>{formatCurrency(pay.baseSalary)}</td>
                    <td style={{ padding: '12px', color: '#dc3545' }}>{formatCurrency(pay.totalDeductions)}</td>
                    <td style={{ padding: '12px', color: '#28a745' }}>{formatCurrency(pay.totalBonuses)}</td>
                    <td style={{ padding: '12px', color: '#ffc107' }}>{formatCurrency(pay.totalAdvances || 0)}</td>
                    <td style={{ padding: '12px', fontWeight: '600' }}>{formatCurrency(pay.netSalary)}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleAddDeduction(pay)}
                          style={{
                            padding: '6px 12px',
                            background: '#667eea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          خصم/إضافة
                        </button>
                        <button
                          onClick={() => handleManage(pay)}
                          style={{
                            padding: '6px 12px',
                            background: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          إدارة
                        </button>
                        <button
                          onClick={() => handlePayslip(pay)}
                          style={{
                            padding: '6px 12px',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          قسيمة راتب
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Deduction/Bonus/Advance Modal */}
      {showAddDeductionModal && selectedPayroll && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddDeductionModal(false)
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
                إضافة خصم / إضافة
              </h2>
              <button
                onClick={() => setShowAddDeductionModal(false)}
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

            <form onSubmit={handleSubmitDeduction}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  نوع العملية:
                </label>
                <select
                  value={deductionForm.type}
                  onChange={(e) => setDeductionForm({ ...deductionForm, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white'
                  }}
                >
                  <option value="deduction">خصم</option>
                  <option value="bonus">مكافأة</option>
                  <option value="advance">سلفة</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  المبلغ:
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={deductionForm.amount}
                  onChange={(e) => setDeductionForm({ ...deductionForm, amount: e.target.value })}
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

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  الوصف:
                </label>
                <textarea
                  value={deductionForm.description}
                  onChange={(e) => setDeductionForm({ ...deductionForm, description: e.target.value })}
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => setShowAddDeductionModal(false)}
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

      {/* Manage Deductions Modal */}
      {showManageModal && selectedPayroll && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowManageModal(false)
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
              maxWidth: '700px',
              maxHeight: '90vh',
              overflowY: 'auto',
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
                إدارة الخصومات والإضافات - {selectedPayroll.employee?.name}
              </h2>
              <button
                onClick={() => setShowManageModal(false)}
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

            {deductions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <p>لا توجد خصومات أو إضافات</p>
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
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>النوع</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>المبلغ</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>الوصف</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deductions.map((ded) => (
                      <tr key={ded.id} style={{
                        borderBottom: '1px solid #eee'
                      }}>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: ded.type === 'deduction' ? '#f8d7da' : ded.type === 'bonus' ? '#d4edda' : '#fff3cd',
                            color: ded.type === 'deduction' ? '#721c24' : ded.type === 'bonus' ? '#155724' : '#856404'
                          }}>
                            {getTypeLabel(ded.type)}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>{formatCurrency(ded.amount)}</td>
                        <td style={{ padding: '12px' }}>{ded.description || '-'}</td>
                        <td style={{ padding: '12px' }}>
                          <button
                            onClick={() => handleDeleteDeduction(ded.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {showPayslipModal && selectedPayroll && selectedPayroll.employee && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPayslipModal(false)
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
            className="payslip-modal-container"
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '30px',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto',
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
                قسيمة راتب
              </h2>
              <button
                onClick={() => setShowPayslipModal(false)}
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

            <div id="payslipContent" style={{
              background: 'white',
              padding: '20px',
              border: '2px solid #ddd',
              borderRadius: '8px'
            }}>
              <div className="payslip-header" style={{
                textAlign: 'center',
                marginBottom: '20px',
                paddingBottom: '15px',
                borderBottom: '2px solid #667eea'
              }}>
                <h2 style={{ color: '#667eea', marginBottom: '8px', fontSize: '20px', fontWeight: 'bold' }}>قسيمة راتب</h2>
                <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>شهر: {formatMonth(selectedMonth)}</p>
              </div>

              <div className="payslip-info" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '20px',
                fontSize: '12px'
              }}>
                <div>
                  <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>الاسم:</strong> {selectedPayroll.employee.name}</p>
                  <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>الرقم الوظيفي:</strong> {selectedPayroll.employee.employeeNumber}</p>
                  <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>الفرع:</strong> {selectedPayroll.employee.branch || '-'}</p>
                  <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>القسم:</strong> {selectedPayroll.employee.department || '-'}</p>
                </div>
                <div>
                  <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>المسمى الوظيفي:</strong> {selectedPayroll.employee.position || '-'}</p>
                  <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>الراتب الأساسي:</strong> {formatCurrency(selectedPayroll.employee.salary)}</p>
                  <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>عدد أيام الشهر (لحساب الراتب):</strong> 30 يوم (ثابت لجميع الشهور)</p>
                  <p style={{ margin: '4px 0', fontSize: '12px' }}><strong>الراتب اليومي:</strong> {formatCurrency(selectedPayroll.employee.salary / 30)}</p>
                </div>
              </div>

              <div className="payslip-section" style={{ marginBottom: '15px' }}>
                <h3 style={{ color: '#333', marginBottom: '8px', paddingBottom: '5px', borderBottom: '1px solid #ddd', fontSize: '14px', fontWeight: 'bold' }}>
                  تفاصيل الحضور
                </h3>
                <div className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                  <span>أيام الحضور:</span>
                  <span>{selectedPayroll.presentDays || 0} يوم</span>
                </div>
                <div className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                  <span>أيام الغياب (مع تبليغ):</span>
                  <span>{selectedPayroll.absentDaysWithNotice || 0} يوم</span>
                </div>
                <div className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                  <span>أيام الغياب (بدون تبليغ):</span>
                  <span>{selectedPayroll.absentDaysWithoutNotice || 0} يوم <span style={{ fontSize: '10px', color: '#666' }}>(يخصم يومين لكل يوم)</span></span>
                </div>
                <div className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                  <span>إجمالي أيام الغياب:</span>
                  <span>{((selectedPayroll.absentDaysWithNotice || 0) + (selectedPayroll.absentDaysWithoutNotice || 0))} يوم</span>
                </div>
                <div className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                  <span>أيام الإجازة:</span>
                  <span>{selectedPayroll.leaveDays || 0} يوم</span>
                </div>
                <div className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                  <span>أيام العطل:</span>
                  <span>{selectedPayroll.holidayDays || 0} يوم</span>
                </div>
              </div>

              <div className="payslip-section" style={{ marginBottom: '15px' }}>
                <h3 style={{ color: '#333', marginBottom: '8px', paddingBottom: '5px', borderBottom: '1px solid #ddd', fontSize: '14px', fontWeight: 'bold' }}>
                  الساعات الإضافية والتأخير
                </h3>
                {(() => {
                  const overtimeHours = selectedPayroll.overtimeHours || 0
                  const timeDelayMinutes = selectedPayroll.timeDelayMinutes || 0
                  const nonTimeDelayMinutes = selectedPayroll.nonTimeDelayMinutes || 0
                  
                  if (overtimeHours > 0 || timeDelayMinutes > 0 || nonTimeDelayMinutes > 0) {
                    return (
                      <>
                        {overtimeHours > 0 && (
                          <>
                            <div className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                              <span>الساعات الإضافية:</span>
                              <span>{overtimeHours.toFixed(2)} ساعة</span>
                            </div>
                            <div className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                              <span>مبلغ الساعات الإضافية:</span>
                              <span style={{ color: '#28a745', fontWeight: '600' }}>{formatCurrency(selectedPayroll.overtimePay || 0)}</span>
                            </div>
                          </>
                        )}
                        {timeDelayMinutes > 0 && (
                          <>
                            <div className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                              <span>دقائق التأخير الزمني:</span>
                              <span>{timeDelayMinutes} دقيقة</span>
                            </div>
                            <div className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                              <span>خصم التأخير الزمني:</span>
                              <span style={{ color: '#dc3545', fontWeight: '600' }}>{formatCurrency(selectedPayroll.timeDelayDeduction || 0)}</span>
                            </div>
                          </>
                        )}
                        {nonTimeDelayMinutes > 0 && (
                          <>
                            <div className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                              <span>دقائق التأخير غير الزمني:</span>
                              <span>{nonTimeDelayMinutes} دقيقة <span style={{ fontSize: '10px', color: '#666' }}>(يخصم دقيقتين لكل دقيقة)</span></span>
                            </div>
                            <div className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                              <span>خصم التأخير غير الزمني:</span>
                              <span style={{ color: '#dc3545', fontWeight: '600' }}>{formatCurrency(selectedPayroll.nonTimeDelayDeduction || 0)}</span>
                            </div>
                          </>
                        )}
                      </>
                    )
                  } else {
                    return (
                      <div className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                        <span>لا توجد ساعات إضافية أو تأخير</span>
                      </div>
                    )
                  }
                })()}
              </div>

              <div className="payslip-section" style={{ marginBottom: '15px' }}>
                <h3 style={{ color: '#333', marginBottom: '8px', paddingBottom: '5px', borderBottom: '1px solid #ddd', fontSize: '14px', fontWeight: 'bold' }}>
                  الراتب المستحق
                </h3>
                <div className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                  <span>الراتب الأساسي:</span>
                  <span>{formatCurrency(selectedPayroll.employee.salary)}</span>
                </div>
                <div className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                  <span>عدد الأيام المستحقة:</span>
                  <span>{selectedPayroll.daysDue || 30} يوم</span>
                </div>
                <div className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                  <span>إجمالي أيام الغياب (بعد حساب التكرار):</span>
                  <span>{((selectedPayroll.absentDaysWithNotice || 0) + ((selectedPayroll.absentDaysWithoutNotice || 0) * 2))} يوم</span>
                </div>
                <div className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                  <span>الراتب بعد خصم الغياب:</span>
                  <span>{(() => {
                    const baseSalary = selectedPayroll.baseSalary || selectedPayroll.employee.salary
                    const dailySalary = baseSalary / 30
                    const totalAbsentDays = (selectedPayroll.absentDaysWithNotice || 0) + ((selectedPayroll.absentDaysWithoutNotice || 0) * 2)
                    return formatCurrency(baseSalary - (dailySalary * totalAbsentDays))
                  })()}</span>
                </div>
              </div>

              <div className="payslip-section" style={{ marginBottom: '15px' }}>
                <h3 style={{ color: '#333', marginBottom: '8px', paddingBottom: '5px', borderBottom: '1px solid #ddd', fontSize: '14px', fontWeight: 'bold' }}>
                  الإضافات
                </h3>
                {deductions.filter(d => d.type === 'bonus').length > 0 ? (
                  deductions.filter(d => d.type === 'bonus').map((bonus, idx) => (
                    <div key={idx} className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                      <span>{bonus.description || 'مكافأة'}:</span>
                      <span>{formatCurrency(bonus.amount)}</span>
                    </div>
                  ))
                ) : (
                  <div className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                    <span>لا توجد إضافات</span>
                  </div>
                )}
                <div className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '2px solid #667eea', marginTop: '8px', fontSize: '12px' }}>
                  <span><strong>إجمالي الإضافات:</strong></span>
                  <span><strong>{formatCurrency(selectedPayroll.totalBonuses || 0)}</strong></span>
                </div>
              </div>

              <div className="payslip-section" style={{ marginBottom: '15px' }}>
                <h3 style={{ color: '#333', marginBottom: '8px', paddingBottom: '5px', borderBottom: '1px solid #ddd', fontSize: '14px', fontWeight: 'bold' }}>
                  الخصومات
                </h3>
                {deductions.filter(d => d.type === 'deduction' || d.type === 'advance').length > 0 ? (
                  deductions.filter(d => d.type === 'deduction' || d.type === 'advance').map((ded, idx) => (
                    <div key={idx} className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                      <span>{ded.description || getTypeLabel(ded.type)}:</span>
                      <span>{formatCurrency(ded.amount)}</span>
                    </div>
                  ))
                ) : (
                  <div className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '12px' }}>
                    <span>لا توجد خصومات</span>
                  </div>
                )}
                <div className="payslip-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '2px solid #667eea', marginTop: '8px', fontSize: '12px' }}>
                  <span><strong>إجمالي الخصومات:</strong></span>
                  <span><strong>{formatCurrency((selectedPayroll.totalDeductions || 0) + (selectedPayroll.totalAdvances || 0))}</strong></span>
                </div>
              </div>

              <div className="payslip-row total" style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderTop: '2px solid #667eea',
                marginTop: '15px',
                fontWeight: 'bold',
                fontSize: '16px',
                color: '#667eea'
              }}>
                <span>صافي الراتب:</span>
                <span>{formatCurrency(selectedPayroll.netSalary)}</span>
              </div>

              <div className="payslip-footer" style={{
                textAlign: 'center',
                marginTop: '20px',
                paddingTop: '15px',
                borderTop: '2px solid #ddd',
                color: '#666',
                fontSize: '11px'
              }}>
                <p style={{ margin: '3px 0', fontSize: '11px' }}>تم إنشاء هذه القسيمة بتاريخ: {new Date().toLocaleDateString('ar-IQ')}</p>
                <p style={{ marginTop: '8px', fontSize: '10px' }}>
                  القرية الصغيرة للتجارة العامة<br />
                  برمجة وتصميم وإدارة: عبدالله عبدالرحمن عبود
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: '20px'
            }}>
              <button
                onClick={() => setShowPayslipModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                إغلاق
              </button>
              <button
                onClick={handlePrintPayslip}
                style={{
                  padding: '10px 20px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                طباعة
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
