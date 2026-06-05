import { NextRequest, NextResponse } from 'next/server'
import { refinePendingTrailGeometries } from '@/features/trails-acquisition/queries/refine-geometry'

const DEFAULT_BATCH_LIMIT = 10

function isAuthorized(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? ''
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return false
  return header === `Bearer ${secret}`
}

async function handle(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Unauthorized', details: {} } },
      { status: 401 },
    )
  }

  const data = await refinePendingTrailGeometries(DEFAULT_BATCH_LIMIT)
  return NextResponse.json({ data })
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  return handle(req)
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return handle(req)
}
