import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { LandingReviewIdSchema } from '@/features/local-seo/schemas/landing-reviews'
import { LandingReviewError, restoreLandingReview } from '@/features/local-seo/queries/landing-reviews'

type Context = { params: Promise<{ id: string }> }

export async function POST(_: NextRequest, context: Context): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  const { id } = await context.params
  if (!LandingReviewIdSchema.safeParse(id).success) return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400)
  try {
    const review = await restoreLandingReview(id)
    revalidatePath(`/conciergerie/${review.destination_slug}`, 'page')
    return NextResponse.json(review)
  } catch (error) {
    if (error instanceof LandingReviewError) return apiError(error.code, 'Avis introuvable', error.status)
    return apiError('INTERNAL_ERROR', 'Erreur interne', 500)
  }
}
