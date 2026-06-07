import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkPhotoLivenessBatch } from '@/features/poi-photos/queries/check-photo-liveness-batch'

function isAuthorized(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? ''
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return false
  return header === `Bearer ${secret}`
}

const BodySchema = z.object({ limit: z.number().int().min(1).max(100).default(25) })

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown = {}
  try {
    body = await req.json()
  } catch {
    // Empty body is valid — limit defaults
  }
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const result = await checkPhotoLivenessBatch(parsed.data.limit)
  return NextResponse.json({ data: result })
}
