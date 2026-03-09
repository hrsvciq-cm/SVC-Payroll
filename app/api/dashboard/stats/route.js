import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from '@/lib/dashboard-stats'
import { withTimeout, DB_TIMEOUT_MS, logConnectionError } from '@/lib/server-utils'
import { handleApiError } from '@/lib/error-handler'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    let user = session?.user
    if (!user) {
      const { data: { user: userData } } = await supabase.auth.getUser()
      user = userData
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const data = await withTimeout(
      getDashboardStats({
        month: searchParams.get('month'),
        employeeId: searchParams.get('employeeId'),
        viewType: searchParams.get('viewType') || 'currentMonth'
      }),
      DB_TIMEOUT_MS,
      'Dashboard stats'
    )
    const res = NextResponse.json(data)
    res.headers.set('Cache-Control', 'private, s-maxage=15, stale-while-revalidate=30')
    return res
  } catch (error) {
    logConnectionError(error, 'Dashboard Stats API')
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { error: errorMessage, status } = handleApiError(error, 'Dashboard Stats')
    return NextResponse.json({ error: errorMessage }, { status })
  }
}
