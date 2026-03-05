'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Payslip from '@/app/components/Payslip'

// Force dynamic rendering to prevent prerendering errors
export const dynamic = 'force-dynamic'

// Helper function to fetch with timeout and retry
async function fetchWithRetry(url, options = {}, maxRetries = 3, timeout = 30000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        return response
      }
      
      // If it's the last attempt or a non-retryable error, throw
      if (attempt === maxRetries || response.status === 401 || response.status === 403) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
}

function PrintAllPayslipsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [payrollData, setPayrollData] = useState([])
  const [deductionsMap, setDeductionsMap] = useState({})

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check authentication first with error handling
      let user = null
      try {
        const supabase = createClient()
        const authResult = await supabase.auth.getUser()
        user = authResult.data?.user
        if (authResult.error) {
          console.warn('Auth error (non-critical):', authResult.error.message)
        }
      } catch (authErr) {
        console.error('Error checking authentication:', authErr)
        // If auth check fails, try to continue - API will handle auth
      }
      
      if (!user) {
        // Try to redirect, but don't block if router is not ready
        try {
          router.push('/login')
        } catch (routerErr) {
          console.warn('Router not ready:', routerErr)
        }
        return
      }

      // Fetch payroll and deductions in parallel for better performance
      const [payrollResponse, deductionsResponse] = await Promise.allSettled([
        fetchWithRetry(`/api/payroll?month=${month}`),
        fetchWithRetry(`/api/deductions?month=${month}`)
      ])

      // Process payroll data
      let payrolls = []
      if (payrollResponse.status === 'fulfilled') {
        try {
          const payrollResult = await payrollResponse.value.json()
          payrolls = payrollResult.data || []
        } catch (parseError) {
          console.error('Error parsing payroll response:', parseError)
          throw new Error('فشل في تحميل بيانات الرواتب')
        }
      } else {
        console.error('Failed to fetch payroll:', payrollResponse.reason)
        throw new Error('فشل في تحميل بيانات الرواتب')
      }

      // Process deductions data (non-critical, continue even if it fails)
      const deductionsByEmployee = {}
      if (deductionsResponse.status === 'fulfilled') {
        try {
          const deductionsResult = await deductionsResponse.value.json()
          const deductions = deductionsResult.data || []
          
          // Group deductions by employeeId
          deductions.forEach(ded => {
            if (!deductionsByEmployee[ded.employeeId]) {
              deductionsByEmployee[ded.employeeId] = []
            }
            deductionsByEmployee[ded.employeeId].push(ded)
          })
        } catch (parseError) {
          console.warn('Error parsing deductions response:', parseError)
          // Continue without deductions - not critical
        }
      } else {
        console.warn('Failed to fetch deductions:', deductionsResponse.reason)
        // Continue without deductions - not critical
      }
      
      setPayrollData(payrolls)
      setDeductionsMap(deductionsByEmployee)
    } catch (error) {
      console.error('Error loading payroll data:', error)
      setError(error.message || 'حدث خطأ في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }, [month, router])
  
  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    // Auto print when page loads and data is ready
    if (!loading && !error && payrollData.length > 0) {
      // Small delay to ensure DOM is fully rendered
      const printTimer = setTimeout(() => {
        window.print()
      }, 800)
      
      return () => clearTimeout(printTimer)
    }
  }, [loading, error, payrollData])

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        gap: '10px'
      }}>
        <div>جاري تحميل البيانات...</div>
        <div style={{ fontSize: '14px', color: '#666' }}>يرجى الانتظار</div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        gap: '15px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ color: '#dc3545', fontWeight: 'bold' }}>خطأ في تحميل البيانات</div>
        <div style={{ fontSize: '14px', color: '#666' }}>{error}</div>
        <button
          onClick={loadData}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          إعادة المحاولة
        </button>
      </div>
    )
  }

  // Empty state
  if (payrollData.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
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

