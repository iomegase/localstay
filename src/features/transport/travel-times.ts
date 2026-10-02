import { unstable_cache } from 'next/cache'
import { z } from 'zod'

export type TravelTime = { walkingSeconds: number | null; drivingSeconds: number | null }
export type TravelTimes = Record<string, TravelTime>
type Point = { latitude: number; longitude: number }
type Destination = Point & { id: string }

// Matrix API : 25 coordonnées max par requête, dont l'origine.
const MAX_DESTINATIONS_PER_REQUEST = 24
const REQUEST_TIMEOUT_MS = 8_000
const CACHE_SECONDS = 7 * 24 * 3600

const matrixSchema = z.object({
  code: z.literal('Ok'),
  durations: z.array(z.array(z.number().nullable())).min(1),
})

const coordinate = (point: Point) => `${point.longitude.toFixed(6)},${point.latitude.toFixed(6)}`

async function fetchDurations(profile: 'walking' | 'driving', origin: Point, destinations: Destination[]): Promise<(number | null)[]> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) throw new Error('MAPBOX_TOKEN_MISSING')
  const coordinates = [origin, ...destinations].map(coordinate).join(';')
  const url =
    `https://api.mapbox.com/directions-matrix/v1/mapbox/${profile}/${coordinates}` +
    `?sources=0&annotations=duration&access_token=${token}`
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), cache: 'no-store' })
  if (!response.ok) throw new Error(`MAPBOX_MATRIX_HTTP_${response.status}`)
  const parsed = matrixSchema.safeParse(await response.json())
  if (!parsed.success) throw new Error('MAPBOX_MATRIX_INVALID')
  // Ligne 0 = origine ; colonne 0 = trajet origine → origine.
  return parsed.data.durations[0].slice(1, destinations.length + 1)
}

/**
 * Temps de trajet réels (MapBox Matrix, spec 057 BR-01) depuis une origine vers
 * des lieux, à pied et en voiture. Jamais estimés ni demandés à Gemini.
 */
export async function computeTravelTimes(origin: Point, destinations: Destination[]): Promise<TravelTimes> {
  const result: TravelTimes = {}
  for (let start = 0; start < destinations.length; start += MAX_DESTINATIONS_PER_REQUEST) {
    const batch = destinations.slice(start, start + MAX_DESTINATIONS_PER_REQUEST)
    const [walking, driving] = await Promise.all([
      fetchDurations('walking', origin, batch),
      fetchDurations('driving', origin, batch),
    ])
    batch.forEach((destination, index) => {
      const valid = (value: number | null | undefined) =>
        typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.round(value) : null
      result[destination.id] = { walkingSeconds: valid(walking[index]), drivingSeconds: valid(driving[index]) }
    })
  }
  return result
}

/** Résultat partagé entre instances (cache de données Next), 7 jours par jeu de coordonnées (BR-02). */
export function getCachedTravelTimes(origin: Point, destinations: Destination[]): Promise<TravelTimes> {
  const key = [coordinate(origin), ...destinations.map(destination => `${destination.id}@${coordinate(destination)}`)].join('|')
  return unstable_cache(() => computeTravelTimes(origin, destinations), ['guide-travel-times', key], {
    revalidate: CACHE_SECONDS,
  })()
}
