import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { LandingDestinationInputSchema } from '@/features/local-seo/schemas/landing-pages'
import {
  createLandingDestination,
  LandingDestinationError,
  listAdminLandingDestinations,
  listEligibleLandingCities,
} from '@/features/local-seo/queries/landing-pages'

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

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSessionAdmin()
    if (session.error) return session.error
    const [destinations, eligible_cities] = await Promise.all([
      listAdminLandingDestinations(),
      listEligibleLandingCities(),
    ])
    return NextResponse.json({ destinations, eligible_cities })
  } catch (error) {
    return landingError(error)
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSessionAdmin()
    if (session.error) return session.error
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400, {})
    }
    const parsed = LandingDestinationInputSchema.safeParse(body)
    if (!parsed.success) return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400, parsed.error.flatten())
    const destination = await createLandingDestination(parsed.data.city_id)
    revalidateLandingDestination(destination.city.slug)
    return NextResponse.json(destination, { status: 201 })
  } catch (error) {
    return landingError(error)
  }
}
