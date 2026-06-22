import { NextRequest, NextResponse } from 'next/server'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { vercelAnalyticsDrainPayloadSchema } from '@/features/admin-analytics/schemas'
import { ingestVercelDrainPayload } from '@/features/admin-analytics/services/vercel-drain'

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.VERCEL_ANALYTICS_DRAIN_SECRET
  const token = new URL(request.url).searchParams.get('token')

  if (!secret) {
    return false
  }

  return token === secret
}

async function readPayload(request: NextRequest): Promise<unknown> {
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return request.json()
  }

  const raw = await request.text()
  if (!raw.trim()) {
    return []
  }

  if (raw.trim().startsWith('{') || raw.trim().startsWith('[')) {
    return JSON.parse(raw)
  }

  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => JSON.parse(line))
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return apiError('UNAUTHORIZED', 'Unauthorized', 401)
  }

  const body = await readPayload(request)
  const parsed = vercelAnalyticsDrainPayloadSchema.safeParse(body)

  if (!parsed.success) {
    return validationError(parsed.error.flatten())
  }

  const result = await ingestVercelDrainPayload(
    Array.isArray(parsed.data) ? parsed.data : [parsed.data],
  )
  return NextResponse.json({
    status: 'ok',
    ingested: result.ingested,
  })
}
