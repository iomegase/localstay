import type { GeocodeResult } from '../types'

interface MapboxFeature {
  center: [number, number]
  relevance: number
  place_name: string
}

export async function geocodeAddress(
  address: string,
  proximity: { longitude: number; latitude: number },
): Promise<GeocodeResult | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) throw new Error('NEXT_PUBLIC_MAPBOX_TOKEN not set')

  const query = encodeURIComponent(address)
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json` +
    `?country=fr&proximity=${proximity.longitude},${proximity.latitude}&limit=1&access_token=${token}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Mapbox API error: ${res.status}`)

  const data = (await res.json()) as { features: MapboxFeature[] }
  if (!data.features || data.features.length === 0) return null

  const feature = data.features[0]
  return {
    latitude: feature.center[1],
    longitude: feature.center[0],
    relevance: feature.relevance,
    place_name: feature.place_name,
  }
}
