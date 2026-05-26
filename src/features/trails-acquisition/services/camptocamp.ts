import type { Prisma } from '@prisma/client'
import { bboxAroundPoint, bboxToMercator, mercatorXToLng, mercatorYToLat } from '../lib/projection'
import type { TrailDifficulty, TrailSourceRef } from '../types'

const CAMPTOCAMP_API = 'https://api.camptocamp.org'
const PAGE_SIZE = 30
const MAX_ROUTES_PER_RUN = 50
const DETAIL_CONCURRENCY = 4

export type CamptocampTrailCandidate = {
  primary_source_type: 'camptocamp'
  source_refs: TrailSourceRef[]
  title: string
  description: string | null
  raw_payload: Prisma.InputJsonValue
  geometry_geojson: Prisma.InputJsonValue
  geometry_status: 'valid' | 'missing'
  start_latitude: number | null
  start_longitude: number | null
  difficulty: TrailDifficulty
  distance_km: number | null
  elevation_gain_m: number | null
  estimated_duration_min: number | null
  metric_source: 'camptocamp'
  start_label: string | null
}

type RouteListItem = {
  document_id: number
  locales?: Array<{ lang?: string; title?: string }>
  activities?: string[]
}

type RouteDetail = {
  document_id: number
  activities?: string[]
  hiking_rating?: string | null
  height_diff_up?: number | null
  height_diff_down?: number | null
  durations?: string[] | null
  geometry?: { geom?: string | null; geom_detail?: string | null }
  locales?: Array<{
    lang?: string
    title?: string
    description?: string | null
    summary?: string | null
    gear?: string | null
    remarks?: string | null
  }>
}

type ListResponse = { total?: number; documents?: RouteListItem[] }

export async function fetchCamptocampTrails(input: {
  latitude: number
  longitude: number
  radiusKm: number
}): Promise<CamptocampTrailCandidate[]> {
  const bbox = bboxToMercator(bboxAroundPoint(input.longitude, input.latitude, input.radiusKm))
  const bboxParam = `${Math.round(bbox.minX)},${Math.round(bbox.minY)},${Math.round(bbox.maxX)},${Math.round(bbox.maxY)}`

  const list = await listHikingRoutes(bboxParam)
  const limited = list.slice(0, MAX_ROUTES_PER_RUN)

  const details = await mapWithConcurrency(limited, DETAIL_CONCURRENCY, async item => {
    try {
      return await fetchRouteDetail(item.document_id)
    } catch {
      return null
    }
  })

  return details
    .filter((detail): detail is RouteDetail => detail !== null)
    .map(normalize)
    .filter((candidate): candidate is CamptocampTrailCandidate => candidate !== null)
}

async function listHikingRoutes(bboxParam: string): Promise<RouteListItem[]> {
  const results: RouteListItem[] = []
  let offset = 0
  // Cap raisonnable : 5 pages × 30 = 150 routes max parcourues
  for (let page = 0; page < 5; page += 1) {
    const url = `${CAMPTOCAMP_API}/routes?bbox=${bboxParam}&act=hiking&limit=${PAGE_SIZE}&offset=${offset}`
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error(`Camptocamp HTTP ${response.status}`)
    const payload = (await response.json()) as ListResponse
    const docs = payload.documents ?? []
    results.push(...docs)
    if (docs.length < PAGE_SIZE) break
    offset += PAGE_SIZE
    if (results.length >= MAX_ROUTES_PER_RUN) break
  }
  return results
}

async function fetchRouteDetail(id: number): Promise<RouteDetail> {
  const response = await fetch(`${CAMPTOCAMP_API}/routes/${id}?l=fr`, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Camptocamp detail HTTP ${response.status}`)
  return (await response.json()) as RouteDetail
}

function normalize(detail: RouteDetail): CamptocampTrailCandidate | null {
  if (!detail.activities?.includes('hiking')) return null

  const frenchLocale = detail.locales?.find(l => l.lang === 'fr') ?? detail.locales?.[0]
  const title = frenchLocale?.title?.trim()
  if (!title) return null

  const geometry = parseGeometry(detail.geometry?.geom_detail ?? detail.geometry?.geom)
  const startPoint = extractStartPoint(geometry)

  const description = htmlToPlainText(frenchLocale?.description ?? frenchLocale?.summary ?? null)
  // Camptocamp `durations` est un enum de plage (1=<1h, 2=2-3h, 3=4-6h, etc.),
  // pas une valeur en heures. On laisse Naismith calculer depuis distance + gain
  // dans l'étape ORS/Naismith en aval.

  return {
    primary_source_type: 'camptocamp',
    source_refs: [{
      type: 'camptocamp',
      name: title,
      url: `https://www.camptocamp.org/routes/${detail.document_id}`,
      attribution: 'Camptocamp.org (CC-BY-SA)',
      used_for: ['content', 'geometry', 'elevation', 'description'],
    }],
    title,
    description,
    raw_payload: detail as unknown as Prisma.InputJsonValue,
    geometry_geojson: (geometry ?? null) as Prisma.InputJsonValue,
    geometry_status: geometry ? 'valid' : 'missing',
    start_latitude: startPoint?.[1] ?? null,
    start_longitude: startPoint?.[0] ?? null,
    difficulty: mapHikingRating(detail.hiking_rating),
    distance_km: geometry ? Math.round(computeLineDistanceKm(geometry) * 10) / 10 : null,
    elevation_gain_m: typeof detail.height_diff_up === 'number' ? detail.height_diff_up : null,
    estimated_duration_min: null,
    metric_source: 'camptocamp',
    start_label: null,
  }
}

function mapHikingRating(rating: string | null | undefined): TrailDifficulty {
  switch (rating) {
    case 'T1':
    case 'T2':
      return 'easy'
    case 'T3':
      return 'medium'
    case 'T4':
      return 'hard'
    case 'T5':
      return 'expert'
    default:
      return 'unknown'
  }
}

type LineGeometry = { type: 'LineString'; coordinates: Array<[number, number]> } | { type: 'MultiLineString'; coordinates: Array<Array<[number, number]>> }

function parseGeometry(geom: string | null | undefined): LineGeometry | null {
  if (!geom) return null
  try {
    const parsed = JSON.parse(geom)
    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.type === 'LineString' && Array.isArray(parsed.coordinates)) {
      const coords = toCoordList(parsed.coordinates)
      return coords.length >= 2 ? { type: 'LineString', coordinates: coords } : null
    }
    if (parsed.type === 'MultiLineString' && Array.isArray(parsed.coordinates)) {
      const segments = parsed.coordinates.map(toCoordList).filter((seg: Array<[number, number]>) => seg.length >= 2)
      return segments.length > 0 ? { type: 'MultiLineString', coordinates: segments } : null
    }
  } catch {
    return null
  }
  return null
}

function toCoordList(values: unknown): Array<[number, number]> {
  if (!Array.isArray(values)) return []
  // Camptocamp encode geom_detail en EPSG:3857 (Web Mercator, mètres).
  // On reprojette vers WGS84 pour homogénéité avec le reste du pipeline.
  return values.flatMap(pair => {
    if (
      Array.isArray(pair) &&
      typeof pair[0] === 'number' &&
      typeof pair[1] === 'number' &&
      Number.isFinite(pair[0]) &&
      Number.isFinite(pair[1])
    ) {
      const lng = mercatorXToLng(pair[0])
      const lat = mercatorYToLat(pair[1])
      if (Math.abs(lng) > 180 || Math.abs(lat) > 90) return []
      return [[lng, lat] as [number, number]]
    }
    return []
  })
}

function extractStartPoint(geometry: LineGeometry | null): [number, number] | null {
  if (!geometry) return null
  if (geometry.type === 'LineString') return geometry.coordinates[0] ?? null
  return geometry.coordinates[0]?.[0] ?? null
}

function computeLineDistanceKm(geometry: LineGeometry): number {
  if (geometry.type === 'LineString') return haversineLineKm(geometry.coordinates)
  return geometry.coordinates.reduce((sum, seg) => sum + haversineLineKm(seg), 0)
}

function haversineLineKm(coords: Array<[number, number]>): number {
  let total = 0
  for (let i = 1; i < coords.length; i += 1) {
    total += haversineKm(coords[i - 1], coords[i])
  }
  return total
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

function htmlToPlainText(html: string | null): string | null {
  if (!html) return null
  const text = html
    .replace(/<\/(p|div|li|h\d|br)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return text.length > 0 ? text.slice(0, 1500) : null
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = cursor
      cursor += 1
      if (index >= items.length) return
      results[index] = await fn(items[index])
    }
  })
  await Promise.all(workers)
  return results
}
