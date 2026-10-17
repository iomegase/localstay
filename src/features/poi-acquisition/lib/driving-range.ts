import type { DrivingAccess } from '@/features/transport/travel-times'

/** Spec 100 BR-01 : au-delà de 20 min en voiture depuis le centre de la ville, le lieu est écarté. */
export const MAX_DRIVING_SECONDS = 20 * 60
/** Spec 100 BR-05 : à plus de 150 m de toute route, le lieu est considéré hors route (refuge, altitude). */
export const OFF_ROAD_METERS = 150
/** Spec 100 BR-05 : refuges et restaurants d'altitude reconnus par leur nom. */
const MOUNTAIN_NAME = /\b(refuge|alpage|buvette|cabane)s?\b/i

type Point = { latitude: number; longitude: number }
type LocatedCandidate = { google_place_id: string; name: string; location: Point | null }
type DrivingAccessFetcher = (
  origin: Point,
  destinations: Array<Point & { id: string }>,
) => Promise<Record<string, DrivingAccess>>

/** Spec 100 BR-05 : refuge ou restaurant d'altitude, jamais écarté au temps de trajet. */
export function isMountainPlace(name: string, access: DrivingAccess | undefined): boolean {
  if (MOUNTAIN_NAME.test(name)) return true
  return typeof access?.roadDistanceMeters === 'number' && access.roadDistanceMeters > OFF_ROAD_METERS
}

/**
 * Spec 100 AC-01-01/03/04/05 : écarte les lieux à plus de 20 min en voiture (Mapbox Matrix).
 * Sans position, sans itinéraire, refuge / lieu hors route, ou si Mapbox échoue : conservé.
 */
export async function filterByDrivingTime<T extends LocatedCandidate>(
  candidates: T[],
  center: Point,
  fetchDrivingAccess: DrivingAccessFetcher,
): Promise<{ kept: T[]; skippedTooFarByRoad: number }> {
  const destinations = candidates.flatMap(candidate => (
    candidate.location ? [{ id: candidate.google_place_id, ...candidate.location }] : []
  ))
  if (destinations.length === 0) return { kept: candidates, skippedTooFarByRoad: 0 }

  let access: Record<string, DrivingAccess>
  try {
    access = await fetchDrivingAccess(center, destinations)
  } catch (error) {
    console.warn('[poi-acquisition] temps de trajet Mapbox indisponible, lieux conservés :', error instanceof Error ? error.message : error)
    return { kept: candidates, skippedTooFarByRoad: 0 }
  }

  const kept = candidates.filter(candidate => {
    const place = access[candidate.google_place_id]
    if (typeof place?.seconds !== 'number' || place.seconds <= MAX_DRIVING_SECONDS) return true
    return isMountainPlace(candidate.name, place)
  })
  return { kept, skippedTooFarByRoad: candidates.length - kept.length }
}
