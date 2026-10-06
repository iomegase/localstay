import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { validationError } from '@/features/merchant/lib/responses'
import { classifyFallbackImages } from '@/features/fallback-images/queries/library'
import { FallbackImageClassifySchema, responseFromFallbackImageError } from '@/features/fallback-images/lib/api'

// Spec 070 AC-01-02 : classement groupé.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const body: unknown = await req.json().catch(() => null)
  const parsed = FallbackImageClassifySchema.safeParse(body)
  if (!parsed.success) return validationError(parsed.error.flatten())

  try {
    return NextResponse.json({ data: await classifyFallbackImages(parsed.data) })
  } catch (error) {
    return responseFromFallbackImageError(error)
  }
}
