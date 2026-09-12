import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { LandingReviewIdSchema, LandingReviewInputSchema } from '@/features/local-seo/schemas/landing-reviews'
import { archiveLandingReview, LandingReviewError, updateLandingReview } from '@/features/local-seo/queries/landing-reviews'

type Context = { params: Promise<{ id: string }> }

function notFound(error: unknown): NextResponse {
  if (error instanceof LandingReviewError) {
    if (error.code === 'VALIDATION_ERROR') {
      return apiError('VALIDATION_ERROR', 'La destination sélectionnée est indisponible.', error.status, {
        destination_slug: ['La destination doit être active et non supprimée.'],
      })
    }
    return apiError(error.code, 'Avis introuvable', error.status)
  }
  return apiError('INTERNAL_ERROR', 'Erreur interne', 500)
}

export async function PATCH(request: NextRequest, context: Context): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  const { id } = await context.params
  const parsedId = LandingReviewIdSchema.safeParse(id)
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('VALIDATION_ERROR', 'Corps JSON invalide.', 400)
  }
  const parsedBody = LandingReviewInputSchema.safeParse(body)
  if (!parsedId.success || !parsedBody.success) return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400)
  try {
    const review = await updateLandingReview(id, parsedBody.data)
    revalidatePath(`/conciergerie/${review.destination_slug}`, 'page')
    return NextResponse.json(review)
  } catch (error) {
    return notFound(error)
  }
}

export async function DELETE(_: NextRequest, context: Context): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  const { id } = await context.params
  if (!LandingReviewIdSchema.safeParse(id).success) return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400)
  try {
    const review = await archiveLandingReview(id)
    revalidatePath(`/conciergerie/${review.destination_slug}`, 'page')
    return NextResponse.json(review)
  } catch (error) {
    return notFound(error)
  }
}
