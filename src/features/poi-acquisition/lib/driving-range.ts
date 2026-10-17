/** Spec 100 BR-01 : au-delà de 20 min en voiture depuis le centre de la ville, le lieu est écarté. */
export const MAX_DRIVING_SECONDS = 20 * 60

type Point = { latitude: number; longitude: number }
type LocatedCandidate = { google_place_id: string; location: Point | null }
type DrivingSecondsFetcher = (
  origin: Point,
  destinations: Array<Point & { id: string }>,
) => Promise<Record<string, number | null>>

/**
 * Spec 100 AC-01-01/03/04 : écarte les lieux à plus de 20 min en voiture (Mapbox Matrix).
 * Sans position, sans itinéraire (durée nulle) ou si Mapbox échoue, le lieu est conservé.
 */
export async function filterByDrivingTime<T extends LocatedCandidate>(
  candidates: T[],
  center: Point,
  fetchDrivingSeconds: DrivingSecondsFetcher,
): Promise<{ kept: T[]; skippedTooFarByRoad: number }> {
  const destinations = candidates.flatMap(candidate => (
    candidate.location ? [{ id: candidate.google_place_id, ...candidate.location }] : []
  ))
  if (destinations.length === 0) return { kept: candidates, skippedTooFarByRoad: 0 }

  let seconds: Record<string, number | null>
  try {
    seconds = await fetchDrivingSeconds(center, destinations)
  } catch (error) {
    console.warn('[poi-acquisition] temps de trajet Mapbox indisponible, lieux conservés :', error instanceof Error ? error.message : error)
    return { kept: candidates, skippedTooFarByRoad: 0 }
  }

  const kept = candidates.filter(candidate => {
    const value = seconds[candidate.google_place_id]
    return typeof value !== 'number' || value <= MAX_DRIVING_SECONDS
  })
  return { kept, skippedTooFarByRoad: candidates.length - kept.length }
}
