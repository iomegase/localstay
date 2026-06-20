import { NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { getAdminAnalyticsLiveBlock } from '@/features/admin-analytics/queries/dashboard'

export async function GET(): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const data = await getAdminAnalyticsLiveBlock()
  return NextResponse.json(data)
}
