import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { LandingPageIdSchema, LandingPagesUpdateSchema } from '@/features/local-seo/schemas/landing-pages'
import {
  deleteLandingDestination,
  LandingDestinationError,
  updateLandingDestinationPages,
} from '@/features/local-seo/queries/landing-pages'

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
    const parsedBody = LandingPagesUpdateSchema.safeParse(body)
    if (!parsedId.success || !parsedBody.success) {
      return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400, {
        ...(parsedId.success ? {} : { id: parsedId.error.flatten() }),
        ...(parsedBody.success ? {} : { body: parsedBody.error.flatten() }),
      })
    }
    const destination = await updateLandingDestinationPages(parsedId.data.id, parsedBody.data.pages)
    revalidateLandingDestination(destination.city.slug)
    return NextResponse.json(destination)
  } catch (error) {
    return landingError(error)
  }
}

export async function DELETE(_: NextRequest, context: Context): Promise<NextResponse> {
  try {
    const session = await getSessionAdmin()
    if (session.error) return session.error
    const { id } = await context.params
    const parsedId = LandingPageIdSchema.safeParse({ id })
    if (!parsedId.success) return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400, { id: parsedId.error.flatten() })
    const destination = await deleteLandingDestination(parsedId.data.id)
    revalidateLandingDestination(destination.city_slug)
    return NextResponse.json({ id: destination.id })
  } catch (error) {
    return landingError(error)
  }
}
