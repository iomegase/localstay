import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { readJson, parsedOrValidationError } from '@/features/poi-acquisition/lib/api'
import { runEventIngestion } from '@/features/events-acquisition/services/ingest-runner'

const FetchSchema = z.object({
  commune: z.string().min(1).max(120),
  radiusKm: z.coerce.number().int().min(1).max(50).default(10),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const body = await readJson(req)
  if (body instanceof NextResponse) return body

  const parsed = parsedOrValidationError(FetchSchema.safeParse(body))
  if (parsed instanceof NextResponse) return parsed

  const data = await runEventIngestion({
    communeFilter: parsed.commune,
    radiusKm: parsed.radiusKm,
    source: 'admin',
  })
  return NextResponse.json({ data })
}
