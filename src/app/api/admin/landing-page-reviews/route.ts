import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { LandingReviewInputSchema } from '@/features/local-seo/schemas/landing-reviews'
import { createLandingReview, LandingReviewError, listAdminLandingPages } from '@/features/local-seo/queries/landing-reviews'

export async function GET(): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  return NextResponse.json({ items: await listAdminLandingPages() })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('VALIDATION_ERROR', 'Corps JSON invalide.', 400)
  }
  const parsed = LandingReviewInputSchema.safeParse(body)
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400, parsed.error.flatten())
  try {
    const review = await createLandingReview(parsed.data)
    revalidatePath(`/conciergerie/${review.destination_slug}`, 'page')
    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    if (error instanceof LandingReviewError && error.code === 'VALIDATION_ERROR') {
      return apiError('VALIDATION_ERROR', 'La destination sélectionnée est indisponible.', error.status, {
        destination_slug: ['La destination doit être active et non supprimée.'],
      })
    }
    return apiError('INTERNAL_ERROR', 'Erreur interne', 500)
  }
}
