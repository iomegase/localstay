import type { Prisma } from '@prisma/client'

export type GpxParseResult =
  | { status: 'valid'; geometry: Prisma.InputJsonValue }
  | { status: 'invalid'; geometry: null }

export function parseGpxToGeoJson(gpxXml: string): GpxParseResult {
  const trackPoints = extractPoints(gpxXml, 'trkpt')
  const routePoints = trackPoints.length >= 2 ? trackPoints : extractPoints(gpxXml, 'rtept')
  if (routePoints.length < 2) return { status: 'invalid', geometry: null }

  return {
    status: 'valid',
    geometry: {
      type: 'LineString',
      coordinates: routePoints,
    },
  }
}

function extractPoints(xml: string, tagName: 'trkpt' | 'rtept'): Array<[number, number]> {
  const pointPattern = new RegExp(`<${tagName}\\b[^>]*>`, 'gi')
  const latPattern = /\blat=["'](-?\d+(?:\.\d+)?)["']/i
  const lonPattern = /\blon=["'](-?\d+(?:\.\d+)?)["']/i
  const points: Array<[number, number]> = []

  for (const match of xml.matchAll(pointPattern)) {
    const tag = match[0]
    const lat = Number(latPattern.exec(tag)?.[1])
    const lon = Number(lonPattern.exec(tag)?.[1])
    if (Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      points.push([lon, lat])
    }
  }

  return points
}
