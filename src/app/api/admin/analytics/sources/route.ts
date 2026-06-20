import { NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { getAdminAnalyticsSourceStatuses } from '@/features/admin-analytics/queries/dashboard'

export async function GET(): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const data = await getAdminAnalyticsSourceStatuses()
  return NextResponse.json({ data })
}
