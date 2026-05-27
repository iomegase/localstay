import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { fetchOrsWalkingRoute } from '@/features/trails-acquisition/services/ors'

const RequestSchema = z.object({
  from: z.tuple([z.number(), z.number()]),
  to: z.tuple([z.number(), z.number()]),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  try {
    const route = await fetchOrsWalkingRoute(parsed.data.from, parsed.data.to)
    if (!route) return NextResponse.json({ data: null })
    return NextResponse.json({ data: route })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ORS_ERROR'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
