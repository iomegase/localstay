export type ParsedGpx = {
  coordinates: Array<[number, number]>
  startLatitude: number
  startLongitude: number
}

export class GpxParseError extends Error {}

export function parseGpx(content: string): ParsedGpx {
  if (!content || content.length > 5_000_000) {
    throw new GpxParseError('Fichier GPX vide ou trop volumineux (max 5 MB)')
  }

  // Extraire tous les <trkpt> ou <rtept> ; on accepte les deux (track ou route).
  const pointRegex = /<(trkpt|rtept)\s[^>]*?lat\s*=\s*["']([^"']+)["'][^>]*?lon\s*=\s*["']([^"']+)["']/gi
  const pointRegexAlt = /<(trkpt|rtept)\s[^>]*?lon\s*=\s*["']([^"']+)["'][^>]*?lat\s*=\s*["']([^"']+)["']/gi

  const coordinates: Array<[number, number]> = []

  for (const match of content.matchAll(pointRegex)) {
    const lat = Number.parseFloat(match[2])
    const lon = Number.parseFloat(match[3])
    if (Number.isFinite(lat) && Number.isFinite(lon)) coordinates.push([lon, lat])
  }
  if (coordinates.length === 0) {
    for (const match of content.matchAll(pointRegexAlt)) {
      const lon = Number.parseFloat(match[2])
      const lat = Number.parseFloat(match[3])
      if (Number.isFinite(lat) && Number.isFinite(lon)) coordinates.push([lon, lat])
    }
  }

  if (coordinates.length < 2) {
    throw new GpxParseError('GPX invalide : moins de 2 points de trace (<trkpt> ou <rtept>)')
  }

  return {
    coordinates,
    startLatitude: coordinates[0][1],
    startLongitude: coordinates[0][0],
  }
}

export function computeLineDistanceKm(coordinates: Array<[number, number]>): number {
  let total = 0
  for (let i = 1; i < coordinates.length; i += 1) {
    total += haversineKm(coordinates[i - 1], coordinates[i])
  }
  return Math.round(total * 10) / 10
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371
  const lat1 = (a[1] * Math.PI) / 180
  const lat2 = (b[1] * Math.PI) / 180
  const dLat = ((b[1] - a[1]) * Math.PI) / 180
  const dLng = ((b[0] - a[0]) * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}
