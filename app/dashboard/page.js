import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from '@/lib/dashboard-stats'
import Layout from '@/app/components/Layout'
import DashboardClient from '@/app/dashboard/DashboardClient'

/**
 * Server-rendered dashboard: initial data is fetched on the server so the first paint shows content immediately (no "جاري التحميل..." delay).
 * الصفحة تُعرض من الخادم لظهور البيانات فوراً دون انتظار تحميل JavaScript.
 */
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  let user = session?.user
  if (!user) {
    const { data: { user: userData } } = await supabase.auth.getUser()
    user = userData
  }
  if (!user) {
    redirect('/login?expired=true')
  }

  const initialData = await getDashboardStats({
    month: '',
    employeeId: '',
    viewType: 'currentMonth'
  })

  return (
    <Layout>
      <DashboardClient
        initialData={initialData}
        initialFilters={{ month: '', employeeId: '', viewType: 'currentMonth' }}
      />
    </Layout>
  )
}
