import { prisma } from '@/shared/lib/prisma'
import { searchGooglePlacesByName } from '../lib/google-places'
import { PoiAcquisitionError } from '../lib/errors'
import { nearestActiveCity } from '../lib/village'
import type { AcquisitionNameSearchResult } from '../types'

/**
 * Spec 066 US-04 : recherche d'un établissement précis par son nom, avec son statut
 * d'ouverture et son village de rattachement (sans filtre, BR-05).
 */
export async function searchAcquisitionPlacesByName(input: {
  city_id: string
  query: string
}): Promise<AcquisitionNameSearchResult[]> {
  const [city, activeCities] = await Promise.all([
    prisma.city.findFirst({
      where: { id: input.city_id, is_active: true, deleted_at: null },
      select: { id: true, slug: true, name: true, latitude: true, longitude: true },
    }),
    prisma.city.findMany({
      where: { is_active: true, deleted_at: null },
      select: { id: true, slug: true, name: true, latitude: true, longitude: true },
    }),
  ])
  if (!city) throw new PoiAcquisitionError('CITY_NOT_FOUND', 404)

  let places: Awaited<ReturnType<typeof searchGooglePlacesByName>>
  try {
    places = await searchGooglePlacesByName({
      query: input.query,
      cityName: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
    })
  } catch {
    throw new PoiAcquisitionError('GOOGLE_PLACES_UNAVAILABLE', 502)
  }

  const cities = activeCities.some(activeCity => activeCity.id === city.id) ? activeCities : [...activeCities, city]
  return places.map(place => {
    const nearest = nearestActiveCity(place.location, cities, city.id)
    return {
      google_place_id: place.google_place_id,
      name: place.name,
      address: place.address,
      business_status: place.business_status,
      nearest_city: nearest ? { slug: nearest.slug, name: nearest.name } : null,
      is_other_village: nearest !== null && nearest.id !== city.id,
    }
  })
}
