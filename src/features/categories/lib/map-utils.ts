import type { PoiCard } from '../types'

export interface ViewState {
  latitude: number
  longitude: number
  zoom: number
}

export interface PoiGeoJson {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    geometry: { type: 'Point'; coordinates: [number, number] }
    properties: {
      id: string
      name: string
      slug: string
      photo_url: string | null
      rating: number | null
    }
  }>
}

export function getInitialViewState(latitude: number, longitude: number): ViewState {
  return { latitude, longitude, zoom: 13 }
}

export function shouldCluster(count: number): boolean {
  return count > 10
}

export function poisToGeoJson(pois: PoiCard[]): PoiGeoJson {
  return {
    type: 'FeatureCollection',
    features: pois.map(p => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
      properties: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        photo_url: p.photo_url,
        rating: p.rating,
      },
    })),
  }
}
