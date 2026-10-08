import type { GeocodeResult } from '../types'

interface MapboxFeature {
  center: [number, number]
  relevance: number
  place_name: string
  place_type?: string[]
}

export type GeocodeOptions = {
  /** 2026-10-08 : parmi les 5 premiers résultats, préférer le premier situé à moins de N km. */
  preferWithinKm?: number
  /** Ne chercher que dans un carré de ±N km autour du point de proximité. */
  bboxKm?: number
}

function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const h = Math.sin(toRad(b.latitude - a.latitude) / 2) ** 2
    + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(toRad(b.longitude - a.longitude) / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

function bboxAround(center: { longitude: number; latitude: number }, km: number): string {
  const dLat = km / 111
  const dLng = km / (111 * Math.cos((center.latitude * Math.PI) / 180))
  return [center.longitude - dLng, center.latitude - dLat, center.longitude + dLng, center.latitude + dLat].map(value => value.toFixed(5)).join(',')
}

export async function geocodeAddress(
  address: string,
  proximity: { longitude: number; latitude: number },
  options: GeocodeOptions = {},
): Promise<GeocodeResult | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) throw new Error('NEXT_PUBLIC_MAPBOX_TOKEN not set')

  const query = encodeURIComponent(address)
  const limit = options.preferWithinKm ? 5 : 1
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json` +
    `?country=fr&proximity=${proximity.longitude},${proximity.latitude}&limit=${limit}` +
    (options.bboxKm ? `&bbox=${bboxAround(proximity, options.bboxKm)}` : '') +
    `&access_token=${token}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Mapbox API error: ${res.status}`)

  const data = (await res.json()) as { features: MapboxFeature[] }
  if (!data.features || data.features.length === 0) return null

  const toResult = (feature: MapboxFeature): GeocodeResult => ({
    latitude: feature.center[1],
    longitude: feature.center[0],
    relevance: feature.relevance,
    place_name: feature.place_name,
    place_type: feature.place_type?.[0],
  })
  const results = data.features.map(toResult)
  if (options.preferWithinKm) {
    const near = results.find(result => distanceKm(proximity, result) <= options.preferWithinKm!)
    if (near) return near
  }
  return results[0]!
}
