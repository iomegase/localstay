import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { refinePendingTrailGeometries } from '@/features/trails-acquisition/queries/refine-geometry'

const ADMIN_BATCH_LIMIT = 10

export async function POST(_req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const data = await refinePendingTrailGeometries(ADMIN_BATCH_LIMIT)
  return NextResponse.json({ data })
}
