import { NextResponse } from 'next/server'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { getPublishedLodgingDetail } from '@/features/lodging-showcase/queries/public-lodgings'
import type { GuideLodgingDetail } from '@/features/guide-app/types'

/**
 * Détail d'un logement pour la vue interne du guide. Réservé aux guests en séjour
 * actif (confinement). La ville vient du query `?city=` (le guest parcourt tous
 * les logements, toutes villes). Renvoie du JSON — jamais de redirection publique.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const context = await getActiveLodgingContext()
  if (!context) {
    return NextResponse.json({ error: 'no-active-stay' }, { status: 403 })
  }

  const citySlug = new URL(request.url).searchParams.get('city')
  if (!citySlug) {
    return NextResponse.json({ error: 'missing-city' }, { status: 400 })
  }

  const { slug } = await params
  const lodging = await getPublishedLodgingDetail(citySlug, slug)
  if (!lodging) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 })
  }

  const detail: GuideLodgingDetail = {
    title: lodging.title,
    cityName: lodging.city_name,
    propertyType: lodging.property_type,
    description: lodging.description,
    maxGuests: lodging.max_guests,
    bedroomCount: lodging.bedroom_count,
    bathroomCount: lodging.bathroom_count,
    surfaceM2: lodging.surface_m2,
    photos: lodging.photos.map(photo => ({ url: photo.url, alt: photo.alt })),
    amenitiesIncluded: lodging.amenities_included,
    amenitiesOnRequest: lodging.amenities_on_request,
  }
  return NextResponse.json(detail)
}
