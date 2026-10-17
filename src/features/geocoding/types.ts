export interface GeocodeResult {
  latitude: number
  longitude: number
  relevance: number
  place_name: string
  /** Précision Mapbox : address, poi, street… ou postcode / place (centre de commune). */
  place_type?: string
  /** Spec 101 : position issue d'OpenStreetMap (Mapbox par défaut). */
  provider?: 'mapbox' | 'openstreetmap'
}

export interface BatchResult {
  geocoded: number
  failed: number
  rejected: number
  skipped: number
}
