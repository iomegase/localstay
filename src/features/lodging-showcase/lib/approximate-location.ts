// Spec 088 : zone approximative publique d'un logement (l'adresse exacte reste privée).

export type ApproximateLocation = { latitude: number; longitude: number; radius_m: number }

export const APPROXIMATE_RADIUS_M = 50
// Décalage + arrondi (≈ 8 m) restent sous le rayon : le logement est toujours dans le cercle.
const MIN_OFFSET_M = 15
const MAX_OFFSET_M = 35
const EARTH_RADIUS_M = 6_371_000

// Hachage FNV-1a : décalage stable pour un logement donné (AC-02).
function hash(text: string): number {
  let value = 0x811c9dc5
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index)
    value = Math.imul(value, 0x01000193)
  }
  return value >>> 0
}

const round4 = (value: number) => Math.round(value * 10_000) / 10_000

/** Spec 088 AC-02 / AC-03 : centre décalé de 15 à 35 m, arrondi à 4 décimales. */
export function approximateLodgingLocation(
  lodgingId: string,
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): ApproximateLocation | null {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null
  const seed = hash(lodgingId)
  const angle = ((seed % 360) * Math.PI) / 180
  const distance = MIN_OFFSET_M + ((seed >>> 9) % (MAX_OFFSET_M - MIN_OFFSET_M + 1))
  const deltaLat = (distance * Math.cos(angle)) / EARTH_RADIUS_M
  const deltaLng = (distance * Math.sin(angle)) / (EARTH_RADIUS_M * Math.cos((latitude * Math.PI) / 180))
  return {
    latitude: round4(latitude + (deltaLat * 180) / Math.PI),
    longitude: round4(longitude + (deltaLng * 180) / Math.PI),
    radius_m: APPROXIMATE_RADIUS_M,
  }
}

export function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

/** Polygone GeoJSON du cercle (pour Mapbox). */
export function circlePolygon(center: { latitude: number; longitude: number }, radiusM: number, steps = 64): number[][] {
  const coordinates: number[][] = []
  for (let step = 0; step <= steps; step += 1) {
    const angle = (step / steps) * 2 * Math.PI
    const dLat = (radiusM * Math.cos(angle)) / EARTH_RADIUS_M
    const dLng = (radiusM * Math.sin(angle)) / (EARTH_RADIUS_M * Math.cos((center.latitude * Math.PI) / 180))
    coordinates.push([center.longitude + (dLng * 180) / Math.PI, center.latitude + (dLat * 180) / Math.PI])
  }
  return coordinates
}
