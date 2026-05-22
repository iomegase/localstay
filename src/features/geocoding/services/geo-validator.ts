import type { GeocodeResult } from '../types'

const MIN_CONFIDENCE = 0.5
const MAX_DISTANCE_KM = 30

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function validateGeocode(
  result: GeocodeResult,
  cityCenter: { latitude: number; longitude: number },
): { valid: boolean; reason?: string } {
  if (result.relevance < MIN_CONFIDENCE) {
    return { valid: false, reason: `confidence ${result.relevance} < ${MIN_CONFIDENCE}` }
  }
  const dist = haversineKm(cityCenter.latitude, cityCenter.longitude, result.latitude, result.longitude)
  if (dist > MAX_DISTANCE_KM) {
    return { valid: false, reason: `distance ${dist.toFixed(1)}km > ${MAX_DISTANCE_KM}km` }
  }
  return { valid: true }
}
