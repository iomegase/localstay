import { Prisma } from '@prisma/client'
import { extractOfficialWebsiteTrailCandidates } from './official-website'
import { normalizeOverpassTrails, type OverpassPayload } from './overpass'
import type { TrailSourceType } from '../types'

type RunSourceInput = {
  city: {
    id: string
    name: string
    latitude: number
    longitude: number
  }
  sourceTypes: TrailSourceType[]
  sourceUrl?: string | null
  zoneRadiusKm?: number | null
}

export type RunSourceResult = {
  candidates: Array<{
    primary_source_type: TrailSourceType
    source_refs: Prisma.InputJsonValue
    raw_payload: Prisma.InputJsonValue
    title: string
    description: string | null
    difficulty?: string | null
    distance_km?: number | null
    elevation_gain_m?: number | null
    estimated_duration_min?: number | null
    loop_type?: string | null
    start_label?: string | null
    start_latitude?: number | null
    start_longitude?: number | null
    geometry_geojson?: Prisma.InputJsonValue | null
    metric_source?: string | null
    geometry_status?: string
    elevation_status?: string
    data_quality_status?: string
  }>
  source_errors: Record<string, string>
}

export async function collectTrailCandidatesFromSources(input: RunSourceInput): Promise<RunSourceResult> {
  const candidates: RunSourceResult['candidates'] = []
  const sourceErrors: Record<string, string> = {}

  if (input.sourceTypes.includes('official_website') && input.sourceUrl) {
    try {
      const response = await fetch(input.sourceUrl)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const html = await response.text()
      candidates.push(...extractOfficialWebsiteTrailCandidates(html, input.sourceUrl))
    } catch (error) {
      sourceErrors.official_website = error instanceof Error ? error.message : String(error)
    }
  }

  if (input.sourceTypes.includes('overpass')) {
    try {
      const payload = await fetchOverpassPayload(input)
      candidates.push(...normalizeOverpassTrails(payload))
    } catch (error) {
      sourceErrors.overpass = error instanceof Error ? error.message : String(error)
    }
  }

  return { candidates, source_errors: sourceErrors }
}

async function fetchOverpassPayload(input: RunSourceInput): Promise<OverpassPayload> {
  const endpoint = process.env.OVERPASS_API_URL
  if (!endpoint) return { elements: [] }
  const radiusMeters = Math.round((input.zoneRadiusKm ?? 15) * 1000)
  const query = `
    [out:json][timeout:25];
    (
      relation["route"="hiking"](around:${radiusMeters},${input.city.latitude},${input.city.longitude});
    );
    out geom;
  `
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'StayLocal/0.1 contact:dev@staylocal.dev',
    },
    body: new URLSearchParams({ data: query }).toString(),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return await response.json() as OverpassPayload
}
