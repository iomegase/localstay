import { rejectGeminiGeoMetrics } from '../lib/source-policy'

export type GeminiTrailDiscovery = {
  title: string
  description?: string
  source_refs?: unknown
  distance_km?: unknown
  elevation_gain_m?: unknown
  start_latitude?: unknown
  start_longitude?: unknown
}

export function sanitizeGeminiTrailDiscovery(candidate: GeminiTrailDiscovery) {
  return rejectGeminiGeoMetrics(candidate)
}
