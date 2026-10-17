import { z } from 'zod'

// Spec 101 BR-03 : serveurs Overpass publics (même ordre que l'import des randonnées), 10 s par appel.
const OVERPASS_FALLBACK_ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]
const REQUEST_TIMEOUT_MS = 10_000
const SEARCH_RADIUS_METERS = 30_000

const overpassSchema = z.object({
  elements: z.array(z.object({
    type: z.string(),
    id: z.number(),
    lat: z.number().optional(),
    lon: z.number().optional(),
    center: z.object({ lat: z.number(), lon: z.number() }).optional(),
    tags: z.record(z.string()).optional(),
  })),
})

type Point = { latitude: number; longitude: number }
export type OsmPlace = Point & { osm_type: string; osm_id: number }

/** Nom exact, sans casse, dans une expression régulière Overpass. */
function exactNamePattern(name: string): string {
  const escaped = name.trim().replace(/[\\^$.*+?()[\]{}|]/g, '\\$&').replace(/"/g, '\\"')
  return `^${escaped}$`
}

function distanceKm(a: Point, b: Point): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

/**
 * Spec 101 AC-01-01/02 : élément OpenStreetMap au nom identique (sans casse) à 30 km du centre de la
 * ville, le plus proche du centre. null si rien n'est trouvé ou si Overpass est indisponible (AC-01-03).
 */
export async function findOsmPlaceByName(name: string, center: Point): Promise<OsmPlace | null> {
  if (name.trim().length < 3) return null
  const query = `[out:json][timeout:8];nwr["name"~"${exactNamePattern(name)}",i](around:${SEARCH_RADIUS_METERS},${center.latitude},${center.longitude});out center tags 20;`
  const primary = process.env.OVERPASS_API_URL
  const endpoints = [...(primary ? [primary] : []), ...OVERPASS_FALLBACK_ENDPOINTS.filter(url => url !== primary)]

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'MyStay/0.1 contact:dev@mystay.city',
        },
        body: new URLSearchParams({ data: query }).toString(),
      })
      if (response.status === 400) return null
      if (!response.ok) continue
      const parsed = overpassSchema.safeParse(await response.json())
      if (!parsed.success) continue
      const places = parsed.data.elements.flatMap(element => {
        const latitude = element.lat ?? element.center?.lat
        const longitude = element.lon ?? element.center?.lon
        return latitude === undefined || longitude === undefined ? [] : [{ latitude, longitude, osm_type: element.type, osm_id: element.id }]
      })
      if (places.length === 0) return null
      return places.reduce((best, place) => (distanceKm(center, place) < distanceKm(center, best) ? place : best))
    } catch {
      continue
    }
  }
  console.warn('[geocoding] OpenStreetMap indisponible pour la recherche par nom')
  return null
}
