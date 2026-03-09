import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from '@/lib/dashboard-stats'
import { logError, handleApiError } from '@/lib/error-handler'

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
    const data = await getDashboardStats({
      month: searchParams.get('month'),
      employeeId: searchParams.get('employeeId'),
      viewType: searchParams.get('viewType') || 'currentMonth'
    })
    return NextResponse.json(data)
  } catch (error) {
    logError(error, 'Dashboard Stats API')
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { error: errorMessage, status } = handleApiError(error, 'Dashboard Stats')
    return NextResponse.json({ error: errorMessage }, { status })
  }
}
