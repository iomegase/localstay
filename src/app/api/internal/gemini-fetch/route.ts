import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { runGeminiFetch } from '@/features/gemini-fetch/services/orchestrator'

function isAuthorized(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? ''
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return false
  return header === `Bearer ${secret}`
}

const BodySchema = z.object({
  city_id: z.string().min(1),
  category_id: z.string().min(1),
  force_refresh: z.boolean().default(false),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { city_id, category_id, force_refresh } = parsed.data

  const result = await runGeminiFetch({
    cityId: city_id,
    categoryId: category_id,
    forceRefresh: force_refresh,
  })

  return NextResponse.json({ data: result }, { status: 200 })
}
