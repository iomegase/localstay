import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/features/merchant/lib/responses'
import { getInternalVercelLiveBlock } from '@/features/admin-analytics/services/vercel-live-aggregate'

function isAuthorized(request: NextRequest): boolean {
  const token = process.env.VERCEL_ANALYTICS_LIVE_TOKEN
  const header = request.headers.get('authorization') ?? ''

  if (!token) {
    return false
  }

  return header === `Bearer ${token}`
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }

  return NextResponse.json(await getInternalVercelLiveBlock())
}
