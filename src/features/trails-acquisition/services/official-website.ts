import { Prisma } from '@prisma/client'
import { normalizeTrailDifficulty } from '../lib/difficulty'
import type { TrailDataQualityStatus, TrailDifficulty, TrailElevationStatus, TrailGeometryStatus, TrailSourceRef } from '../types'

export type OfficialWebsiteTrailCandidate = {
  primary_source_type: 'official_website'
  source_refs: TrailSourceRef[]
  title: string
  description: string | null
  difficulty?: TrailDifficulty
  distance_km?: number
  elevation_gain_m?: number
  estimated_duration_min?: number
  loop_type?: string
  data_quality_status?: TrailDataQualityStatus
  start_label?: string
  start_latitude?: number
  start_longitude?: number
  geometry_geojson?: Prisma.InputJsonValue
  metric_source?: string
  geometry_status?: TrailGeometryStatus
  elevation_status?: TrailElevationStatus
  raw_payload: {
    source_url: string
    extracted_from: 'html'
  }
}

const TRAIL_TITLE_PATTERN = /(randonn[ée]e|rando|sentier|itin[ée]raire|trail)/i

export function extractOfficialWebsiteTrailCandidates(html: string, sourceUrl: string): OfficialWebsiteTrailCandidate[] {
  const source = new URL(sourceUrl)
  const sourceRef: TrailSourceRef = {
    type: 'official_website',
    url: sourceUrl,
    attribution: source.hostname,
    used_for: ['content'],
  }
  const structuredData = extractStructuredTrailData(html)

  const headingCandidates = extractHeadingBlocks(html)
    .filter(block => TRAIL_TITLE_PATTERN.test(block.title))
    .map(block => candidateFromBlock(block, sourceRef, sourceUrl, structuredData))

  if (headingCandidates.length > 0) return headingCandidates

  const pageCandidate = extractPageCandidate(html, sourceUrl)
  return pageCandidate ? [candidateFromBlock(pageCandidate, sourceRef, sourceUrl, structuredData)] : []
}

function candidateFromBlock(
  block: { title: string; description: string | null },
  sourceRef: TrailSourceRef,
  sourceUrl: string,
  structuredData: OfficialWebsiteTrailStructuredData,
): OfficialWebsiteTrailCandidate {
  return {
    primary_source_type: 'official_website',
    source_refs: [sourceRef],
    title: block.title,
    description: block.description,
    ...structuredData,
    raw_payload: {
      source_url: sourceUrl,
      extracted_from: 'html',
    },
  }
}

function extractHeadingBlocks(html: string): Array<{ title: string; description: string | null }> {
  const headingPattern = /<h[1-3]\b[^>]*>(.*?)<\/h[1-3]>([\s\S]{0,600})/gi
  const paragraphPattern = /<p\b[^>]*>(.*?)<\/p>/i
  const blocks: Array<{ title: string; description: string | null }> = []

  for (const match of html.matchAll(headingPattern)) {
    const title = cleanHtml(match[1])
    if (!title) continue
    const followingHtml = match[2] ?? ''
    const description = cleanHtml(paragraphPattern.exec(followingHtml)?.[1] ?? '')
    blocks.push({ title, description: description || null })
  }

  return dedupeByTitle(blocks)
}

type OfficialWebsiteTrailStructuredData = Partial<{
  difficulty: TrailDifficulty
  distance_km: number
  elevation_gain_m: number
  estimated_duration_min: number
  loop_type: string
  data_quality_status: TrailDataQualityStatus
  start_label: string
  start_latitude: number
  start_longitude: number
  geometry_geojson: Prisma.InputJsonValue
  metric_source: string
  geometry_status: TrailGeometryStatus
  elevation_status: TrailElevationStatus
}>

function extractStructuredTrailData(html: string): OfficialWebsiteTrailStructuredData {
  const hwSheet = extractHwSheet(html)
  const geolocation = getRecordOrFirstArrayValue(hwSheet, 'geolocations')
  const trace = getRecordValue(getRecordValue(hwSheet, 'dataItinerary'), 'itinerary') ?? getRecordValue(hwSheet, 'trace')
  const jsonLdGeo = extractJsonLdGeo(html)
  const tracePoints =
    getRecordArrayValue(trace, 'points').length > 0
      ? getRecordArrayValue(trace, 'points')
      : getRecordArrayValue(trace, 'tabPoints')
  const geometry = tracePointsToLineString(tracePoints)
  const distance =
    numberFromRecordValue(getRecordValue(hwSheet, 'itineraryLength'), 'value') ??
    parseDistanceKm(extractCriterionValue(html, 'Distance'))
  const elevationGain =
    parseIntegerMetric(extractCriterionValue(html, 'Dénivelé positif')) ??
    parseIntegerMetric(extractCriterionValue(html, 'Dénivelé'))
  const locomotion = firstRecord(getRecordArrayValue(hwSheet, 'locomotions'))
  const durationText = stringFromRecordValue(locomotion, 'duration') ?? extractCriterionValue(html, 'Durée journalière')
  const difficultyText = stringFromRecordValue(locomotion, 'difficulty') ?? extractCriterionValue(html, 'Niveau de difficulté')
  const startLabel = extractTopoStartLabel(hwSheet) ?? extractCriterionValue(html, 'Départ')
  const latitude = numberFromRecordValue(geolocation, 'latitude') ?? jsonLdGeo?.latitude
  const longitude = numberFromRecordValue(geolocation, 'longitude') ?? jsonLdGeo?.longitude
  const data: OfficialWebsiteTrailStructuredData = {}

  if (difficultyText) data.difficulty = normalizeTrailDifficulty(difficultyText)
  if (distance !== null) data.distance_km = distance
  if (elevationGain !== null) data.elevation_gain_m = elevationGain
  const duration = parseDurationMinutes(durationText)
  if (duration !== null) data.estimated_duration_min = duration
  const fallbackLoopType = stringFromRecordValue(firstRecord(getRecordArrayValue(hwSheet, 'locomotions').slice(1)), 'typeTraceItinerary')
  const loopType = normalizeLoopType(stringFromRecordValue(getRecordValue(trace, '_typeTraceItinerary'), 'label') ?? fallbackLoopType)
  if (loopType) data.loop_type = loopType
  if (startLabel) data.start_label = startLabel
  if (latitude !== null) data.start_latitude = latitude
  if (longitude !== null) data.start_longitude = longitude
  if (geometry) data.geometry_geojson = geometry

  const hasMetrics = data.distance_km !== undefined || data.elevation_gain_m !== undefined || data.estimated_duration_min !== undefined
  const hasStart = data.start_latitude !== undefined && data.start_longitude !== undefined
  if (hasMetrics || hasStart || data.geometry_geojson) data.metric_source = 'official_website'
  if (data.geometry_geojson) data.geometry_status = 'valid'
  if (data.elevation_gain_m !== undefined) data.elevation_status = 'valid'
  if (hasStart && data.geometry_geojson && data.distance_km !== undefined && data.elevation_gain_m !== undefined) {
    data.data_quality_status = 'complete'
  }

  return data
}

function extractPageCandidate(html: string, sourceUrl: string): { title: string; description: string | null } | null {
  const title = normalizeDetailTitle(
    extractMetaContent(html, 'og:title') ??
      extractMetaContent(html, 'twitter:title') ??
      extractTagContent(html, 'h1') ??
      extractTagContent(html, 'title') ??
      titleFromUrl(sourceUrl),
  )
  if (!title) return null

  const description =
    extractMetaContent(html, 'description') ??
    extractMetaContent(html, 'og:description') ??
    extractMetaContent(html, 'twitter:description') ??
    firstParagraph(html)

  return { title, description }
}

function extractHwSheet(html: string): Record<string, unknown> | null {
  const assignmentIndex = html.search(/\bHwSheet\s*=/)
  if (assignmentIndex < 0) return null
  const objectStart = html.indexOf('{', assignmentIndex)
  if (objectStart < 0) return null
  const objectText = readBalancedObject(html, objectStart)
  if (!objectText) return null
  try {
    const parsed: unknown = JSON.parse(objectText)
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

function readBalancedObject(input: string, start: number): string | null {
  let depth = 0
  let inString: '"' | "'" | null = null
  let escaped = false
  for (let index = start; index < input.length; index += 1) {
    const char = input[index]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === inString) {
        inString = null
      }
      continue
    }
    if (char === '"' || char === "'") {
      inString = char
      continue
    }
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return input.slice(start, index + 1)
    }
  }
  return null
}

function extractJsonLdGeo(html: string): { latitude: number; longitude: number } | null {
  const scriptPattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  for (const match of html.matchAll(scriptPattern)) {
    try {
      const parsed: unknown = JSON.parse(cleanScriptJson(match[1] ?? ''))
      const geo = findGeoInJsonLd(parsed)
      if (geo) return geo
    } catch {
      // Ignore malformed third-party JSON-LD blocks.
    }
  }
  return null
}

function cleanScriptJson(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim()
}

function findGeoInJsonLd(value: unknown): { latitude: number; longitude: number } | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const geo = findGeoInJsonLd(item)
      if (geo) return geo
    }
    return null
  }
  if (!isRecord(value)) return null
  const geoRecord = getRecordValue(value, 'geo')
  const latitude = numberFromRecordValue(geoRecord, 'latitude')
  const longitude = numberFromRecordValue(geoRecord, 'longitude')
  if (latitude !== null && longitude !== null) return { latitude, longitude }
  for (const nestedValue of Object.values(value)) {
    const geo = findGeoInJsonLd(nestedValue)
    if (geo) return geo
  }
  return null
}

function extractCriterionValue(html: string, label: string): string | null {
  const labelPattern = new RegExp(`<small\\b[^>]*>\\s*${escapeRegExp(label)}\\s*<\\/small>([\\s\\S]{0,300})`, 'i')
  const match = labelPattern.exec(html)
  if (!match) return null
  const following = match[1] ?? ''
  const value = /<(?:span|div)\b[^>]*>([\s\S]*?)<\/(?:span|div)>/i.exec(following)?.[1] ?? ''
  return cleanHtml(value) || null
}

function extractTopoStartLabel(hwSheet: Record<string, unknown> | null): string | null {
  const descriptions = getRecordArrayValue(hwSheet, 'sfThematicDescription')
  for (const description of descriptions) {
    if (!isRecord(description)) continue
    const name = stringFromRecordValue(description, 'name') ?? stringFromRecordValue(description, 'type')
    if (!name?.toLowerCase().includes('topo')) continue
    const value = rawStringFromRecordValue(description, 'value')
    const start = (value ?? '').split(/Départ\s*:\s*/i)[1]?.split(/\\r\\n|\\n|\r?\n/)[0]
    if (start) return cleanHtml(start.replace(/<br\s*\/?>.*$/i, ''))
  }
  return null
}

function tracePointsToLineString(points: unknown[]): Prisma.InputJsonValue | null {
  const coordinates = points
    .map(point => {
      if (!isRecord(point)) return null
      const latitude = numberFromRecordValue(point, 'lat')
      const longitude = numberFromRecordValue(point, 'lng')
      const elevation = numberFromRecordValue(point, 'elevation')
      if (latitude === null || longitude === null) return null
      return elevation === null ? [longitude, latitude] : [longitude, latitude, elevation]
    })
    .filter((point): point is number[] => point !== null)

  if (coordinates.length < 2) return null
  return {
    type: 'LineString',
    coordinates,
  }
}

function parseDistanceKm(value: string | null): number | null {
  if (!value) return null
  const parsed = parseLocalizedNumber(value)
  if (parsed === null) return null
  return /m\b/i.test(value) && !/km\b/i.test(value) ? parsed / 1000 : parsed
}

function parseIntegerMetric(value: string | null): number | null {
  const parsed = parseLocalizedNumber(value)
  return parsed === null ? null : Math.round(parsed)
}

function parseDurationMinutes(value: string | null): number | null {
  if (!value) return null
  const normalized = value.toLowerCase().replace(',', '.')
  const hours = /(\d+(?:\.\d+)?)\s*h/.exec(normalized)?.[1]
  const minutes = /(\d+)\s*(?:min|mn)/.exec(normalized)?.[1]
  if (!hours && !minutes) return null
  return Math.round((hours ? Number(hours) * 60 : 0) + (minutes ? Number(minutes) : 0))
}

function parseLocalizedNumber(value: string | null | undefined): number | null {
  if (!value) return null
  const match = /-?\d+(?:[,.]\d+)?/.exec(value.replace(/\s+/g, ' '))
  if (!match) return null
  const parsed = Number(match[0].replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeLoopType(value: string | null | undefined): string | null {
  const normalized = value?.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (!normalized) return null
  if (normalized.includes('boucle') || normalized.includes('loop')) return 'loop'
  if (normalized.includes('aller') && normalized.includes('retour')) return 'out_and_back'
  if (normalized.includes('traversee')) return 'point_to_point'
  return null
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getRecordValue(record: Record<string, unknown> | null | undefined, key: string): Record<string, unknown> | null {
  if (!record) return null
  const value = record[key]
  return isRecord(value) ? value : null
}

function getRecordArrayValue(record: Record<string, unknown> | null | undefined, key: string): unknown[] {
  if (!record) return []
  const value = record[key]
  return Array.isArray(value) ? value : []
}

function getRecordOrFirstArrayValue(record: Record<string, unknown> | null | undefined, key: string): Record<string, unknown> | null {
  if (!record) return null
  const value = record[key]
  if (isRecord(value)) return value
  return Array.isArray(value) ? firstRecord(value) : null
}

function firstRecord(values: unknown[]): Record<string, unknown> | null {
  const value = values.find(isRecord)
  return value ?? null
}

function stringFromRecordValue(record: Record<string, unknown> | null | undefined, key: string): string | null {
  if (!record) return null
  const value = record[key]
  return typeof value === 'string' && value.trim() ? cleanHtml(value) : null
}

function rawStringFromRecordValue(record: Record<string, unknown> | null | undefined, key: string): string | null {
  if (!record) return null
  const value = record[key]
  return typeof value === 'string' && value.trim() ? value : null
}

function numberFromRecordValue(record: Record<string, unknown> | null | undefined, key: string): number | null {
  if (!record) return null
  const value = record[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') return parseLocalizedNumber(value)
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function extractMetaContent(html: string, name: string): string | null {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = parseAttributes(match[0])
    if (attrs.name !== name && attrs.property !== name) continue
    return cleanHtml(attrs.content ?? '') || null
  }
  return null
}

function extractTagContent(html: string, tagName: 'h1' | 'title'): string | null {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>(.*?)<\\/${tagName}>`, 'is')
  return cleanHtml(pattern.exec(html)?.[1] ?? '') || null
}

function firstParagraph(html: string): string | null {
  const paragraphPattern = /<p\b[^>]*>(.*?)<\/p>/i
  return cleanHtml(paragraphPattern.exec(html)?.[1] ?? '') || null
}

function normalizeDetailTitle(title: string | null): string | null {
  if (!title) return null
  const withoutSiteSuffix = title
    .split(/\s+\|\s+/)[0]
    .replace(/\s+-\s+Saint-Gervais-les-Bains.*$/i, '')
    .replace(/^ITI\s+[–-]\s+/i, '')
    .replace(/\s+#\d+$/i, '')
    .trim()
  return withoutSiteSuffix || null
}

function titleFromUrl(sourceUrl: string): string | null {
  const slug = new URL(sourceUrl).pathname.split('/').filter(Boolean).at(-1)
  if (!slug) return null
  return cleanHtml(
    slug
      .replace(/-fr-\d+$/i, '')
      .replace(/-/g, ' '),
  )
}

function cleanHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_match, codePoint: string) => String.fromCodePoint(Number(codePoint)))
    .replace(/&rsquo;|&#x2019;/g, '’')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function parseAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const pattern = /([a-zA-Z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g
  for (const match of tag.matchAll(pattern)) {
    attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? ''
  }
  return attrs
}

function dedupeByTitle(blocks: Array<{ title: string; description: string | null }>) {
  const seen = new Set<string>()
  return blocks.filter(block => {
    const key = block.title.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
