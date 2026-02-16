'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Payslip from '@/app/components/Payslip'

// Force dynamic rendering to prevent prerendering errors
export const dynamic = 'force-dynamic'

function PrintAllPayslipsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7)
  
  const [loading, setLoading] = useState(true)
  const [payrollData, setPayrollData] = useState([])
  const [deductionsMap, setDeductionsMap] = useState({})

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      try {
        // Fetch all payroll records for the month
        const payrollResponse = await fetch(`/api/payroll?month=${month}`)
        if (payrollResponse.ok) {
          const payrollResult = await payrollResponse.json()
          const payrolls = payrollResult.data || []
          
          // Fetch all deductions for all employees in this month
          const employeeIds = payrolls.map(p => p.employeeId)
          if (employeeIds.length > 0) {
            try {
              const deductionsResponse = await fetch(`/api/deductions?month=${month}`)
              if (deductionsResponse.ok) {
                const deductionsResult = await deductionsResponse.json()
                const deductions = deductionsResult.data || []
                
                // Group deductions by employeeId
                const deductionsByEmployee = {}
                deductions.forEach(ded => {
                  if (!deductionsByEmployee[ded.employeeId]) {
                    deductionsByEmployee[ded.employeeId] = []
                  }
                  deductionsByEmployee[ded.employeeId].push(ded)
                })
                
                setDeductionsMap(deductionsByEmployee)
              } else {
                console.warn('Failed to fetch deductions:', deductionsResponse.status)
              }
            } catch (deductionsError) {
              console.error('Error fetching deductions:', deductionsError)
              // Continue without deductions - not critical
            }
          }
          
          setPayrollData(payrolls)
        } else {
          console.error('Failed to fetch payroll:', payrollResponse.status)
        }
      } catch (error) {
        console.error('Error loading payroll data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [month, router])

  useEffect(() => {
    // Auto print when page loads
    if (!loading && payrollData.length > 0) {
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [loading, payrollData])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        جاري تحميل البيانات...
      </div>
    )
  }

  if (payrollData.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        لا توجد قسائم رواتب لهذا الشهر
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
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
          direction: rtl;
        }
        
        .payslip-wrapper {
          width: 100%;
          max-width: 100%;
          padding: 20px;
          margin: 0;
          background: white;
          page-break-after: always;
          page-break-inside: avoid;
        }
        
        .payslip-wrapper:last-child {
          page-break-after: auto;
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
        
        .payslip-signatures {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #ddd;
        }
        
        .payslip-signatures p {
          font-size: 12px;
          font-weight: bold;
          margin: 0;
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
            page-break-after: always;
            page-break-inside: avoid;
          }
          
          .payslip-wrapper:last-child {
            page-break-after: auto;
          }
          
          .payslip-section {
            page-break-inside: avoid;
          }
          
          .payslip-row {
            page-break-inside: avoid;
          }
        }
        
        @media screen {
          body {
            padding: 20px;
            background: #f5f5f5;
          }
          
          .payslip-wrapper {
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            border-radius: 4px;
          }
        }
      `}</style>
      
      <div style={{ direction: 'rtl' }}>
        {payrollData.map((payroll) => (
          <Payslip
            key={payroll.id}
            payroll={payroll}
            deductions={deductionsMap[payroll.employeeId] || []}
            showSignatures={true}
          />
        ))}
      </div>
    </>
  )
}

export default function PrintAllPayslipsPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        جاري تحميل البيانات...
      </div>
    }>
      <PrintAllPayslipsContent />
    </Suspense>
  )
}

