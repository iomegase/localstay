import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { validationError } from '@/features/merchant/lib/responses'
import { analyticsListFiltersSchema } from '@/features/admin-analytics/schemas'
import { listAdminAnalyticsQueries } from '@/features/admin-analytics/queries/dashboard'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const parsed = analyticsListFiltersSchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  )

  if (!parsed.success) {
    return validationError(parsed.error.flatten())
  }

  const data = await listAdminAnalyticsQueries(parsed.data)
  return NextResponse.json({ data })
}
