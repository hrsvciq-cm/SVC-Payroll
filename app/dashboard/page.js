import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from '@/lib/dashboard-stats'
import { withTimeout, DB_TIMEOUT_MS, logConnectionError } from '@/lib/server-utils'
import Layout from '@/app/components/Layout'
import DashboardClient from '@/app/dashboard/DashboardClient'

const DEFAULT_FILTERS = { month: '', employeeId: '', viewType: 'currentMonth' }

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

  let initialData = null
  let initialError = false
  try {
    initialData = await withTimeout(
      getDashboardStats(DEFAULT_FILTERS),
      DB_TIMEOUT_MS,
      'Dashboard stats'
    )
  } catch (err) {
    initialError = true
    logConnectionError(err, 'Dashboard')
  }

  return (
    <Layout>
      <DashboardClient
        initialData={initialData}
        initialError={initialError}
        initialFilters={DEFAULT_FILTERS}
      />
    </Layout>
  )
}
