import { haversineKm } from '@/features/geolocation/lib/user-location'

export type VillageCity = {
  id: string
  slug: string
  name: string
  latitude: number
  longitude: number
}

/**
 * Spec 066 BR-02 : village de rattachement = City active au centre le plus proche,
 * la City du run l'emportant en cas d'égalité. La position Google sert uniquement
 * à ce filtre (BR-01) et n'est jamais stockée.
 */
export function nearestActiveCity<T extends VillageCity>(
  location: { latitude: number; longitude: number } | null,
  cities: T[],
  runCityId: string,
): T | null {
  if (!location) return null

  let nearest: { city: T; distanceKm: number } | null = null
  for (const city of cities) {
    const distanceKm = haversineKm(location.latitude, location.longitude, city.latitude, city.longitude)
    if (
      !nearest
      || distanceKm < nearest.distanceKm
      || (distanceKm === nearest.distanceKm && city.id === runCityId)
    ) {
      nearest = { city, distanceKm }
    }
  }

  return nearest?.city ?? null
}

type FilterableCandidate = {
  business_status: string | null
  location: { latitude: number; longitude: number } | null
}

/**
 * Spec 066 BR-03 : écarte, avant tout traitement payant, les lieux fermés
 * définitivement et ceux rattachés à un autre village actif.
 */
export function filterCandidatesForVillage<T extends FilterableCandidate>(
  candidates: T[],
  cities: VillageCity[],
  runCityId: string,
): { kept: T[]; skippedOtherVillage: number; skippedClosedPermanently: number } {
  const kept: T[] = []
  let skippedOtherVillage = 0
  let skippedClosedPermanently = 0

  for (const candidate of candidates) {
    if (candidate.business_status === 'CLOSED_PERMANENTLY') {
      skippedClosedPermanently += 1
      continue
    }
    const village = nearestActiveCity(candidate.location, cities, runCityId)
    if (village && village.id !== runCityId) {
      skippedOtherVillage += 1
      continue
    }
    kept.push(candidate)
  }

  return { kept, skippedOtherVillage, skippedClosedPermanently }
}
