import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { runGeocodeBatch } from '../../../../features/geocoding/services/geocode-runner'

function isAuthorized(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? ''
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return false
  return header === `Bearer ${secret}`
}

const BodySchema = z.object({
  city_id: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(50).default(10),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown = {}
  try {
    body = await req.json()
  } catch {
    // Empty body is valid — all fields are optional
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const result = await runGeocodeBatch({
    cityId: parsed.data.city_id,
    limit: parsed.data.limit,
  })

  return NextResponse.json({ data: result })
}
