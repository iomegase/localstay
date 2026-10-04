import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { GoogleReviewIdSchema, PublicationsInputSchema } from '@/features/google-reviews/schemas'
import { GoogleReviewPublicationError, setGoogleReviewPublications } from '@/features/google-reviews/queries/publications'

type Context = { params: Promise<{ id: string }> }

const MESSAGES = {
  REVIEW_NOT_FOUND: 'Avis Google introuvable.',
  DESTINATION_NOT_FOUND: 'Destination indisponible.',
  REVIEW_HAS_NO_TEXT: 'Un avis sans commentaire ne peut pas être publié.',
} as const

/** Spec 062 AC-02-03 : définit l'ensemble des destinations où l'avis est publié. */
export async function PUT(request: NextRequest, context: Context): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  const { id } = await context.params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError('VALIDATION_ERROR', 'Corps JSON invalide.', 400)
  }
  const parsedId = GoogleReviewIdSchema.safeParse(id)
  const parsedBody = PublicationsInputSchema.safeParse(body)
  if (!parsedId.success || !parsedBody.success) {
    return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400, parsedBody.success ? {} : parsedBody.error.flatten())
  }
  try {
    const result = await setGoogleReviewPublications(parsedId.data, parsedBody.data.destination_ids)
    revalidatePath('/conciergerie/[city-slug]', 'page')
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof GoogleReviewPublicationError) return apiError(error.code, MESSAGES[error.code], error.status)
    return apiError('INTERNAL_ERROR', 'Erreur interne', 500)
  }
}
