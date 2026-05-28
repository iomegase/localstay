import { geocodeAddress } from '@/features/geocoding/services/mapbox-client'

const GEOCODING_TIMEOUT_MS = 8_000
const GEOCODING_CONCURRENCY = 5

type GeocodableCandidate = {
  start_label?: string | null
  start_latitude?: number | null
  start_longitude?: number | null
  source_refs?: unknown
}

type CityRef = { name: string; latitude: number; longitude: number }

/**
 * Pour les candidats qui ont un start_label mais pas de coordonnées de départ
 * (typiquement les randos découvertes uniquement via Gemini), on essaie de
 * géocoder le label via Mapbox pour leur donner au moins un point sur la carte.
 *
 * Le label est concaténé avec le nom de la ville pour augmenter la précision
 * du géocodage (ex: "Parking du Bettex" + "Saint-Gervais-les-Bains").
 */
export async function enrichCandidatesWithStartGeocoding<T extends GeocodableCandidate>(
  candidates: T[],
  city: CityRef,
): Promise<{ enriched: number; errors: number }> {
  let enriched = 0
  let errors = 0

  const toEnrich = candidates.filter(c =>
    Boolean(c.start_label) &&
    (c.start_latitude == null || c.start_longitude == null),
  )

  await mapWithConcurrency(toEnrich, GEOCODING_CONCURRENCY, async candidate => {
    try {
      const query = `${candidate.start_label}, ${city.name}`
      const result = await withTimeout(
        geocodeAddress(query, { latitude: city.latitude, longitude: city.longitude }),
        GEOCODING_TIMEOUT_MS,
      )
      if (result && result.relevance >= 0.5) {
        candidate.start_latitude = result.latitude
        candidate.start_longitude = result.longitude
        candidate.source_refs = appendMapboxRef(candidate.source_refs)
        enriched += 1
      }
    } catch {
      errors += 1
    }
  })

  return { enriched, errors }
}

function appendMapboxRef(existing: unknown): unknown {
  const ref = { type: 'mapbox', attribution: 'Mapbox Geocoding', used_for: ['start_latitude', 'start_longitude'] }
  if (!Array.isArray(existing)) return [ref]
  return [...existing, ref]
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout ${ms}ms`)), ms)
    promise.then(value => { clearTimeout(timer); resolve(value) }, err => { clearTimeout(timer); reject(err) })
  })
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = cursor
      cursor += 1
      if (index >= items.length) return
      results[index] = await fn(items[index])
    }
  })
  await Promise.all(workers)
  return results
}
