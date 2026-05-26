/**
 * Conversion WGS84 (EPSG:4326) ↔ Web Mercator (EPSG:3857).
 * Camptocamp et plusieurs APIs spatiales utilisent EPSG:3857 pour les bbox.
 */

const EARTH_HALF_CIRCUMFERENCE = 20037508.34

export function lngToMercatorX(lng: number): number {
  return (lng * EARTH_HALF_CIRCUMFERENCE) / 180
}

export function latToMercatorY(lat: number): number {
  const clamped = Math.max(-89.999, Math.min(89.999, lat))
  const y = Math.log(Math.tan(((90 + clamped) * Math.PI) / 360)) / (Math.PI / 180)
  return (y * EARTH_HALF_CIRCUMFERENCE) / 180
}

export type BBox4326 = { minLng: number; minLat: number; maxLng: number; maxLat: number }
export type BBox3857 = { minX: number; minY: number; maxX: number; maxY: number }

export function mercatorXToLng(x: number): number {
  return (x / EARTH_HALF_CIRCUMFERENCE) * 180
}

export function mercatorYToLat(y: number): number {
  const ratio = (y / EARTH_HALF_CIRCUMFERENCE) * 180
  return (180 / Math.PI) * (2 * Math.atan(Math.exp((ratio * Math.PI) / 180)) - Math.PI / 2)
}

export function bboxAroundPoint(lng: number, lat: number, radiusKm: number): BBox4326 {
  const latRad = (lat * Math.PI) / 180
  const dLat = radiusKm / 111
  const dLng = radiusKm / (111 * Math.cos(latRad))
  return {
    minLng: lng - dLng,
    minLat: lat - dLat,
    maxLng: lng + dLng,
    maxLat: lat + dLat,
  }
}

export function bboxToMercator(bbox: BBox4326): BBox3857 {
  return {
    minX: lngToMercatorX(bbox.minLng),
    minY: latToMercatorY(bbox.minLat),
    maxX: lngToMercatorX(bbox.maxLng),
    maxY: latToMercatorY(bbox.maxLat),
  }
}
