import { NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { getAdminAnalyticsGa4TodayBlock } from '@/features/admin-analytics/queries/dashboard'

export async function GET(): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const data = await getAdminAnalyticsGa4TodayBlock()
  return NextResponse.json(data)
}
