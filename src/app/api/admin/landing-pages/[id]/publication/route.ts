import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { LandingPageIdSchema, LandingPublicationInputSchema } from '@/features/local-seo/schemas/landing-pages'
import { LandingDestinationError, setLandingDestinationActive } from '@/features/local-seo/queries/landing-pages'

type Context = { params: Promise<{ id: string }> }

function revalidateLandingDestination(citySlug: string) {
  revalidatePath('/admin/landing-pages')
  revalidatePath('/sitemap.xml')
  revalidatePath(`/conciergerie/${citySlug}`, 'page')
  revalidatePath(`/seminaires/${citySlug}`, 'page')
  revalidatePath(`/locations-vacances/${citySlug}`, 'page')
  revalidatePath('/confier-mon-logement', 'page')
  revalidatePath('/seminaires', 'page')
  revalidatePath('/logements', 'page')
}

function landingError(error: unknown): NextResponse {
  if (error instanceof LandingDestinationError) {
    const message = error.code === 'NOT_FOUND'
      ? 'Destination introuvable'
      : error.code === 'DESTINATION_ALREADY_EXISTS'
        ? 'Cette ville possède déjà une configuration.'
        : 'Les contenus obligatoires doivent être complétés avant activation.'
    return apiError(error.code, message, error.status, error.details)
  }
  return apiError('INTERNAL_ERROR', 'Erreur interne', 500)
}

export async function PATCH(request: NextRequest, context: Context): Promise<NextResponse> {
  try {
    const session = await getSessionAdmin()
    if (session.error) return session.error
    const { id } = await context.params
    const parsedId = LandingPageIdSchema.safeParse({ id })
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400, {})
    }
    const parsedBody = LandingPublicationInputSchema.safeParse(body)
    if (!parsedId.success || !parsedBody.success) {
      return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400, {
        ...(parsedId.success ? {} : { id: parsedId.error.flatten() }),
        ...(parsedBody.success ? {} : { body: parsedBody.error.flatten() }),
      })
    }
    const destination = await setLandingDestinationActive(parsedId.data.id, parsedBody.data.is_active)
    revalidateLandingDestination(destination.city.slug)
    return NextResponse.json(destination)
  } catch (error) {
    return landingError(error)
  }
}
