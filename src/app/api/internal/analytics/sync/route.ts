import { NextRequest, NextResponse } from 'next/server'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { analyticsSyncRequestSchema } from '@/features/admin-analytics/schemas'
import { runAdminAnalyticsSync } from '@/features/admin-analytics/services/sync'

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET
  const header = request.headers.get('authorization') ?? ''

  if (!secret) {
    return false
  }

  return header === `Bearer ${secret}`
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }

  const body = request.headers.get('content-type')?.includes('application/json')
    ? await request.json()
    : {}
  const parsed = analyticsSyncRequestSchema.safeParse(body)

  if (!parsed.success) {
    return validationError(parsed.error.flatten())
  }

  const result = await runAdminAnalyticsSync(parsed.data)
  return NextResponse.json(result)
}
