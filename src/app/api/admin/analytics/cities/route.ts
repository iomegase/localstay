import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { validationError } from '@/features/merchant/lib/responses'
import { analyticsDateRangeSchema } from '@/features/admin-analytics/schemas'
import { listAdminAnalyticsCities } from '@/features/admin-analytics/queries/dashboard'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const parsed = analyticsDateRangeSchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  )

  if (!parsed.success) {
    return validationError(parsed.error.flatten())
  }

  const data = await listAdminAnalyticsCities(parsed.data)
  return NextResponse.json({ data })
}
