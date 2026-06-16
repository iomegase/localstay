import { Prisma } from '@prisma/client'
import { extractOfficialWebsiteTrailCandidates } from './official-website'
import { fetchCamptocampTrails } from './camptocamp'
import { enrichCandidatesWithIgn } from './ign'
import { enrichCandidatesWithDuration } from './ors'
import { discoverTrailsWithGemini, enrichCandidatesWithGeminiDescriptions, extractStartLabelFromDescription } from './gemini-trails'
import { enrichCandidatesWithStartGeocoding } from './start-geocoding'
import { normalizeOverpassTrails, type OverpassPayload } from './overpass'
import { mergeDuplicateCandidates } from '../lib/dedup'
import { inheritGeometryByTitle } from '../lib/geometry-inheritance'
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

  if (input.sourceTypes.includes('camptocamp')) {
    try {
      const trails = await fetchCamptocampTrails({
        latitude: input.city.latitude,
        longitude: input.city.longitude,
        radiusKm: input.zoneRadiusKm ?? 15,
      })
      candidates.push(...trails)
    } catch (error) {
      sourceErrors.camptocamp = error instanceof Error ? error.message : String(error)
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

  if (input.sourceTypes.includes('ign')) {
    try {
      await enrichCandidatesWithIgn(candidates)
    } catch (error) {
      sourceErrors.ign = error instanceof Error ? error.message : String(error)
    }
  }

  if (input.sourceTypes.includes('gemini')) {
    // 1. Découverte de randos emblématiques absentes d'OSM (sans coords → needs_review)
    try {
      const discoveries = await discoverTrailsWithGemini(input.city)
      const existingTitles = new Set(candidates.map(c => c.title.toLowerCase()))
      for (const trail of discoveries) {
        if (existingTitles.has(trail.title.toLowerCase())) continue
        const usedFor = ['title', 'description']
        if (trail.distance_km != null) usedFor.push('distance_km')
        if (trail.elevation_gain_m != null) usedFor.push('elevation_gain_m')
        if (trail.estimated_duration_min != null) usedFor.push('estimated_duration_min')
        if (trail.difficulty != null) usedFor.push('difficulty')
        candidates.push({
          primary_source_type: 'gemini',
          source_refs: [{ type: 'gemini', attribution: 'Gemini (Google Search grounded)', used_for: usedFor }] as Prisma.InputJsonValue,
          raw_payload: { trail } as Prisma.InputJsonValue,
          title: trail.title,
          description: trail.description,
          start_label: trail.start_label,
          distance_km: trail.distance_km,
          elevation_gain_m: trail.elevation_gain_m,
          estimated_duration_min: trail.estimated_duration_min,
          difficulty: trail.difficulty,
          metric_source: trail.distance_km != null || trail.elevation_gain_m != null ? 'gemini_grounded' : null,
          geometry_status: 'missing',
          elevation_status: trail.elevation_gain_m != null ? 'valid' : 'missing',
          data_quality_status: 'needs_review',
        })
      }
    } catch (error) {
      sourceErrors.gemini_discovery = error instanceof Error ? error.message : String(error)
    }

    // 2. Enrichissement des descriptions manquantes (candidats Overpass sans description)
    try {
      await enrichCandidatesWithGeminiDescriptions(candidates, input.city)
    } catch (error) {
      sourceErrors.gemini_descriptions = error instanceof Error ? error.message : String(error)
    }
  }

  // 3. Fallback regex pour start_label depuis la description (cas où Gemini n'a pas structuré)
  for (const candidate of candidates) {
    if (!candidate.start_label && candidate.description) {
      const extracted = extractStartLabelFromDescription(candidate.description)
      if (extracted) candidate.start_label = extracted
    }
  }

  // 4. Géocodage Mapbox du start_label pour les candidats sans coordonnées de départ
  // (typiquement les randos découvertes via Gemini-only). "Parking du Bettex" →
  // (45.8732, 6.6731). Permet la publication même sans géométrie Overpass/C2C.
  try {
    await enrichCandidatesWithStartGeocoding(candidates, input.city)
  } catch (error) {
    sourceErrors.start_geocoding = error instanceof Error ? error.message : String(error)
  }

  // 5. Estimation de durée : ORS si clé dispo + géométrie, sinon Naismith local
  try {
    await enrichCandidatesWithDuration(candidates)
  } catch (error) {
    sourceErrors.duration = error instanceof Error ? error.message : String(error)
  }

  // 6. Fusion des doublons inter-sources (mêmes randos avec titres légèrement différents)
  const merged = mergeDuplicateCandidates(candidates)

  // 7. Héritage de géométrie par titre — DÉSACTIVÉ (plan 2026-06-05, Phase B).
  // Produisait des tracés faux (rando homonyme mais itinéraire différent). L'appel est
  // conservé mais retourne un no-op ; voir TITLE_INHERITANCE_ENABLED dans geometry-inheritance.
  inheritGeometryByTitle(merged)

  return { candidates: merged, source_errors: sourceErrors }
}

const OVERPASS_FALLBACK_ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]

const TRANSIENT_HTTP_STATUSES = new Set([429, 502, 503, 504])

async function fetchOverpassPayload(input: RunSourceInput): Promise<OverpassPayload> {
  const primary = process.env.OVERPASS_API_URL
  if (!primary) return { elements: [] }

  const radiusMeters = Math.round((input.zoneRadiusKm ?? 15) * 1000)
  const query = `
    [out:json][timeout:60];
    (
      relation["route"="hiking"](around:${radiusMeters},${input.city.latitude},${input.city.longitude});
    );
    out geom;
  `

  const endpoints = [primary, ...OVERPASS_FALLBACK_ENDPOINTS.filter(url => url !== primary)]
  let lastError: Error | null = null

  for (let i = 0; i < endpoints.length; i += 1) {
    try {
      return await postOverpass(endpoints[i], query)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      const status = readStatus(lastError)
      const isTransient = status === null || TRANSIENT_HTTP_STATUSES.has(status)
      const hasNextEndpoint = i < endpoints.length - 1
      if (!isTransient || !hasNextEndpoint) break
      await delay(500 * (i + 1))
    }
  }

  throw lastError ?? new Error('Overpass failed')
}

async function postOverpass(endpoint: string, query: string): Promise<OverpassPayload> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'MyStay/0.1 contact:dev@mystay.city',
    },
    body: new URLSearchParams({ data: query }).toString(),
  })
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`) as Error & { status: number }
    err.status = response.status
    throw err
  }
  return await response.json() as OverpassPayload
}

function readStatus(error: Error): number | null {
  const status = Reflect.get(error, 'status')
  if (typeof status === 'number') return status
  const match = error.message.match(/HTTP (\d{3})/)
  return match ? Number(match[1]) : null
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
