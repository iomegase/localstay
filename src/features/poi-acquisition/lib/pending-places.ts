import type { Prisma } from '@prisma/client'
import type { GooglePlaceCandidate } from './google-places'

/**
 * Spec 072 AC-01-01 : candidats Google retenus, conservés sur le run jusqu'à leur
 * traitement (les dates sont stockées en ISO).
 */
export function serializePendingPlaces(places: GooglePlaceCandidate[]): Prisma.InputJsonValue {
  return places.map(place => ({
    ...place,
    google_review_expires_at: place.google_review_expires_at?.toISOString() ?? null,
  })) as unknown as Prisma.InputJsonValue
}

export function deserializePendingPlaces(value: Prisma.JsonValue | null | undefined): GooglePlaceCandidate[] {
  if (!Array.isArray(value)) return []
  return value.flatMap(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const place = item as Record<string, unknown>
    if (typeof place.name !== 'string' || typeof place.address !== 'string') return []
    const expires = typeof place.google_review_expires_at === 'string' ? new Date(place.google_review_expires_at) : null
    return [{ ...(place as unknown as GooglePlaceCandidate), google_review_expires_at: expires }]
  })
}
