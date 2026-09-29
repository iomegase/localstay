import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { DescriptionAssistanceError } from '@/features/poi-description-assistance/lib/contracts'
import { suggestPoiDescription } from '@/features/poi-description-assistance/queries/suggest-description'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  try {
    const { id } = await context.params
    if (!z.string().uuid().safeParse(id).success || await hasRequestContent(req)) throw new DescriptionAssistanceError('INVALID_INPUT')
    const data = await suggestPoiDescription(id)
    return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const failure = error instanceof DescriptionAssistanceError ? error : new DescriptionAssistanceError('DESCRIPTION_GENERATION_FAILED')
    console.error('[poi-description-assistance]', { code: failure.code, status: failure.status })
    return apiError(failure.code, failure.message, failure.status)
  }
}

async function hasRequestContent(req: NextRequest): Promise<boolean> {
  // Next's Node adapter can supply a non-null stream for an empty POST.
  // Read until EOF or the first byte; never buffer an unexpected payload.
  if (!req.body) return false
  const reader = req.body.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) return false
      if (value.byteLength > 0) return true
    }
  } finally {
    await reader.cancel()
    reader.releaseLock()
  }
}
