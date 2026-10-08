export interface GeocodeResult {
  latitude: number
  longitude: number
  relevance: number
  place_name: string
  /** Précision Mapbox : address, poi, street… ou postcode / place (centre de commune). */
  place_type?: string
}

export interface BatchResult {
  geocoded: number
  failed: number
  rejected: number
  skipped: number
}
