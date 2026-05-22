export interface GeocodeResult {
  latitude: number
  longitude: number
  relevance: number
  place_name: string
}

export interface BatchResult {
  geocoded: number
  failed: number
  rejected: number
  skipped: number
}
