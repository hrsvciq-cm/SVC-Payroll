'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Layout from '@/app/components/Layout'

export default function ReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

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
        padding: '24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          marginBottom: '24px',
          color: '#333'
        }}>
          التقارير
        </h1>
        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '16px',
          color: '#666'
        }}>
          <p>ميزات التقارير قيد التطوير</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>
            سيتم إضافة تقارير الموظفين، الحضور، والرواتب قريباً
          </p>
        </div>
      </div>
    </Layout>
  )
}
