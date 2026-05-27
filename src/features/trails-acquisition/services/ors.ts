/**
 * Estimation de durée de randonnée.
 * - Naismith (local) : 12 min/km + 10 min par 100m de dénivelé positif.
 * - OpenRouteService (optionnel) : foot-hiking profile via API directions.
 */

const ORS_ENDPOINT = 'https://api.openrouteservice.org/v2/directions/foot-hiking'
const ORS_WALKING_ENDPOINT = 'https://api.openrouteservice.org/v2/directions/foot-walking/geojson'
const ORS_MAX_WAYPOINTS = 50

export type OrsWalkingRoute = {
  geometry: { type: 'LineString'; coordinates: Array<[number, number]> }
  distance_m: number
  duration_s: number
}

export async function fetchOrsWalkingRoute(
  from: [number, number],
  to: [number, number],
): Promise<OrsWalkingRoute | null> {
  const apiKey = process.env.ORS_API_KEY
  if (!apiKey) return null

  const response = await fetch(ORS_WALKING_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ coordinates: [from, to] }),
  })
  if (!response.ok) throw new Error(`ORS HTTP ${response.status}`)

  const payload = await response.json() as {
    features?: Array<{
      geometry?: { type?: string; coordinates?: unknown }
      properties?: { summary?: { distance?: number; duration?: number } }
    }>
  }
  const feature = payload.features?.[0]
  const geom = feature?.geometry
  const summary = feature?.properties?.summary
  if (!geom || geom.type !== 'LineString' || !Array.isArray(geom.coordinates)) return null

  const coords = geom.coordinates.flatMap(p => {
    if (Array.isArray(p) && typeof p[0] === 'number' && typeof p[1] === 'number') {
      return [[p[0], p[1]] as [number, number]]
    }
    return []
  })
  if (coords.length < 2) return null

  return {
    geometry: { type: 'LineString', coordinates: coords },
    distance_m: summary?.distance ?? 0,
    duration_s: summary?.duration ?? 0,
  }
}

export function naismithDurationMin(distanceKm: number | null | undefined, elevationGainM: number | null | undefined): number | null {
  if (typeof distanceKm !== 'number' || !Number.isFinite(distanceKm) || distanceKm <= 0) return null
  const flatMinutes = distanceKm * 12
  const climbMinutes = typeof elevationGainM === 'number' && Number.isFinite(elevationGainM) && elevationGainM > 0
    ? (elevationGainM / 100) * 10
    : 0
  return Math.round(flatMinutes + climbMinutes)
}

export async function fetchOrsHikingDuration(coordinates: Array<[number, number]>): Promise<number | null> {
  const apiKey = process.env.ORS_API_KEY
  if (!apiKey) return null
  if (coordinates.length < 2) return null

  const sampled = sampleCoordinates(coordinates, ORS_MAX_WAYPOINTS)

  const response = await fetch(ORS_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ coordinates: sampled, elevation: true }),
  })
  if (!response.ok) throw new Error(`ORS HTTP ${response.status}`)
  const payload = await response.json() as {
    routes?: Array<{ summary?: { duration?: number; distance?: number } }>
  }
  const duration = payload.routes?.[0]?.summary?.duration
  if (typeof duration !== 'number' || !Number.isFinite(duration)) return null
  return Math.round(duration / 60)
}

function sampleCoordinates(coords: Array<[number, number]>, max: number): Array<[number, number]> {
  if (coords.length <= max) return coords
  const step = (coords.length - 1) / (max - 1)
  const out: Array<[number, number]> = []
  for (let i = 0; i < max; i += 1) out.push(coords[Math.round(i * step)])
  return out
}

type DurationEnrichable = {
  distance_km?: number | null
  elevation_gain_m?: number | null
  estimated_duration_min?: number | null
  geometry_geojson?: unknown
  source_refs?: unknown
}

export async function enrichCandidatesWithDuration<T extends DurationEnrichable>(
  candidates: T[],
): Promise<{ naismith: number; ors: number; errors: number }> {
  let naismith = 0
  let ors = 0
  let errors = 0
  const orsEnabled = Boolean(process.env.ORS_API_KEY)

  for (const candidate of candidates) {
    if (candidate.estimated_duration_min != null) continue

    // Priorité 1 : ORS si clé disponible et géométrie présente
    if (orsEnabled) {
      const coords = extractCoordinates(candidate.geometry_geojson)
      if (coords.length >= 2) {
        try {
          const duration = await fetchOrsHikingDuration(coords)
          if (duration != null) {
            candidate.estimated_duration_min = duration
            candidate.source_refs = appendOrsRef(candidate.source_refs)
            ors += 1
            continue
          }
        } catch {
          errors += 1
        }
      }
    }

    // Priorité 2 : Naismith local si distance + (optionnellement) dénivelé connus
    const naismithValue = naismithDurationMin(candidate.distance_km, candidate.elevation_gain_m)
    if (naismithValue != null) {
      candidate.estimated_duration_min = naismithValue
      naismith += 1
    }
  }

  return { naismith, ors, errors }
}

function extractCoordinates(geometry: unknown): Array<[number, number]> {
  if (!geometry || typeof geometry !== 'object') return []
  const geo = geometry as { type?: string; coordinates?: unknown }
  if (!Array.isArray(geo.coordinates)) return []
  if (geo.type === 'LineString') return toPairs(geo.coordinates)
  if (geo.type === 'MultiLineString') return geo.coordinates.flatMap(line => (Array.isArray(line) ? toPairs(line) : []))
  return []
}

function toPairs(values: unknown[]): Array<[number, number]> {
  return values.flatMap(pair => {
    if (
      Array.isArray(pair) &&
      typeof pair[0] === 'number' &&
      typeof pair[1] === 'number' &&
      Number.isFinite(pair[0]) &&
      Number.isFinite(pair[1])
    ) {
      return [[pair[0], pair[1]] as [number, number]]
    }
    return []
  })
}

function appendOrsRef(existing: unknown): unknown {
  const ref = { type: 'ors', attribution: 'OpenRouteService', used_for: ['estimated_duration_min'] }
  if (!Array.isArray(existing)) return [ref]
  return [...existing, ref]
}
