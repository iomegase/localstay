/**
 * Affinage de géométrie rando via OpenRouteService (profil foot-hiking).
 * Re-trace l'itinéraire le long du vrai réseau de sentiers à partir des waypoints existants,
 * densifie et supprime les "raccourcis" en ligne droite. Garde-fou : si la longueur recalculée
 * dévie de plus de 40 % de l'originale, on rejette (re-route parti ailleurs).
 * Voir plan 2026-06-05 (Phase C).
 */
const ENDPOINT = 'https://api.openrouteservice.org/v2/directions/foot-hiking/geojson'
const MAX_WAYPOINTS = 50
const MAX_DEVIATION_RATIO = 0.4 // ±40 %

type Coord = [number, number]

export type RefinedGeometry = {
  geometry: { type: 'LineString'; coordinates: Coord[] }
  source_ref: { type: 'ors_match'; attribution: string; used_for: string[] }
}

export async function refineTrailGeometry(geometry: unknown): Promise<RefinedGeometry | null> {
  const apiKey = process.env.ORS_API_KEY
  if (!apiKey) return null

  const coords = flatten(geometry)
  if (coords.length < 2) return null

  const waypoints = sample(coords, MAX_WAYPOINTS)

  let response: Response
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/geo+json, application/json',
      },
      body: JSON.stringify({ coordinates: waypoints }),
    })
  } catch {
    return null
  }
  if (!response.ok) return null

  const payload = (await response.json()) as {
    features?: Array<{ geometry?: { type?: string; coordinates?: unknown } }>
  }
  const geom = payload.features?.[0]?.geometry
  if (!geom || geom.type !== 'LineString' || !Array.isArray(geom.coordinates)) return null

  const refined = flatten(geom)
  if (refined.length < 2) return null

  // Garde-fou de déviation : compare la longueur recalculée à l'originale.
  const originalM = lineLengthM(coords)
  const refinedM = lineLengthM(refined)
  if (originalM > 0) {
    const ratio = Math.abs(refinedM - originalM) / originalM
    if (ratio > MAX_DEVIATION_RATIO) return null
  }

  return {
    geometry: { type: 'LineString', coordinates: refined },
    source_ref: {
      type: 'ors_match',
      attribution: 'OpenRouteService foot-hiking (calage réseau sentiers)',
      used_for: ['geometry'],
    },
  }
}

function flatten(geometry: unknown): Coord[] {
  if (!geometry || typeof geometry !== 'object') return []
  const g = geometry as { type?: string; coordinates?: unknown }
  if (!Array.isArray(g.coordinates)) return []
  if (g.type === 'LineString') return toPairs(g.coordinates)
  if (g.type === 'MultiLineString') return g.coordinates.flatMap(l => (Array.isArray(l) ? toPairs(l) : []))
  return []
}

function toPairs(values: unknown[]): Coord[] {
  return values.flatMap(p =>
    Array.isArray(p) &&
    typeof p[0] === 'number' &&
    typeof p[1] === 'number' &&
    Number.isFinite(p[0]) &&
    Number.isFinite(p[1])
      ? [[p[0], p[1]] as Coord]
      : [],
  )
}

function sample(coords: Coord[], max: number): Coord[] {
  if (coords.length <= max) return coords
  const step = (coords.length - 1) / (max - 1)
  const out: Coord[] = []
  for (let i = 0; i < max; i += 1) out.push(coords[Math.round(i * step)])
  return out
}

function lineLengthM(coords: Coord[]): number {
  let total = 0
  for (let i = 1; i < coords.length; i += 1) total += haversineM(coords[i - 1], coords[i])
  return total
}

function haversineM(a: Coord, b: Coord): number {
  const R = 6_371_000
  const lat1 = (a[1] * Math.PI) / 180
  const lat2 = (b[1] * Math.PI) / 180
  const dLat = ((b[1] - a[1]) * Math.PI) / 180
  const dLng = ((b[0] - a[0]) * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}
