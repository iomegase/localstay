import { Prisma } from '@prisma/client'
import { fetchOfficialWebsiteTrailCandidates } from './official-website'
import { fetchCamptocampTrails } from './camptocamp'
import { enrichCandidatesWithIgn } from './ign'
import { enrichCandidatesWithDuration } from './ors'
import { enrichCandidatesWithTrailPhotos } from './camptocamp-photos'
import { discoverTrailsWithGemini, enrichCandidatesWithGeminiDescriptions, extractStartLabelFromDescription } from './gemini-trails'
import { enrichCandidatesWithStartGeocoding } from './start-geocoding'
import { normalizeOverpassTrails, type OverpassPayload } from './overpass'
import { mergeDuplicateCandidates } from '../lib/dedup'
import { IMPORT_WORK_BUDGET_MS, IMPORT_SOURCE_TIMEOUT_MS, IMPORT_ENRICHMENT_TIMEOUT_MS, IMPORT_DESCRIPTION_TIMEOUT_MS, IMPORT_IGN_TIMEOUT_MS, runWithDeadline } from '../lib/import-budget'
import type { TrailSourceType } from '../types'
import type { DescriptionSource } from '@/shared/lib/description-sources'

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
    /** Spec 094 : sources de la description (recherche web Gemini). */
    description_sources?: DescriptionSource[] | null
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

export async function collectTrailCandidatesFromSources(
  input: RunSourceInput,
  onCheckpoint?: (result: RunSourceResult) => Promise<void>,
): Promise<RunSourceResult> {
  const deadline = Date.now() + IMPORT_WORK_BUDGET_MS
  const sourceErrors: Record<string, string> = {}
  type Candidate = RunSourceResult['candidates'][number]
  const discoveries: Array<{ name: string; partial?: Candidate[]; work: (signal: AbortSignal) => Promise<Candidate[]> }> = []

  if (input.sourceTypes.includes('official_website') && input.sourceUrl) {
    const partial: Candidate[] = []
    discoveries.push({ name: 'official_website', partial, work: signal =>
      fetchOfficialWebsiteTrailCandidates(input.sourceUrl!, signal, candidate => partial.push(candidate)),
    })
  }
  if (input.sourceTypes.includes('camptocamp')) {
    const partial: Candidate[] = []
    discoveries.push({ name: 'camptocamp', partial, work: signal => fetchCamptocampTrails({
      latitude: input.city.latitude, longitude: input.city.longitude,
      radiusKm: input.zoneRadiusKm ?? 15, signal, onCandidate: candidate => partial.push(candidate),
    }) })
  }
  if (input.sourceTypes.includes('overpass')) {
    discoveries.push({ name: 'overpass', work: async signal => normalizeOverpassTrails(await fetchOverpassPayload(input, signal)) })
  }
  if (input.sourceTypes.includes('gemini')) {
    discoveries.push({ name: 'gemini_discovery', work: async () => (await discoverTrailsWithGemini(input.city)).map(trail => ({
      primary_source_type: 'gemini',
      source_refs: [{ type: 'gemini', attribution: 'Gemini', used_for: ['title', 'description', 'start_label'] }],
      raw_payload: { trail }, title: trail.title, description: trail.description,
      start_label: trail.start_label, geometry_status: 'missing', elevation_status: 'missing', data_quality_status: 'needs_review',
    })) })
  }

  const results = await Promise.allSettled(discoveries.map(source =>
    runWithDeadline(deadline, IMPORT_SOURCE_TIMEOUT_MS, source.work),
  ))
  const collected: Candidate[] = []
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') collected.push(...result.value)
    else {
      collected.push(...structuredClone(discoveries[index].partial ?? []))
      sourceErrors[discoveries[index].name] = result.reason instanceof Error ? result.reason.message : 'Source indisponible'
    }
  })
  let candidates = mergeDuplicateCandidates(collected)
  const checkpoint = async () => {
    await onCheckpoint?.({ candidates: structuredClone(candidates), source_errors: { ...sourceErrors } })
  }
  // Persist discovery before starting any potentially expensive enrichment.
  await checkpoint()

  async function enrich(name: string, work: (items: Candidate[], signal: AbortSignal) => Promise<{ errors?: number }>, timeoutMs = IMPORT_ENRICHMENT_TIMEOUT_MS) {
    if (candidates.length === 0) return
    if (Date.now() >= deadline) {
      sourceErrors[name] = 'Budget de temps de l’import épuisé'
      return
    }
    const draft = structuredClone(candidates)
    try {
      const result = await runWithDeadline(deadline, timeoutMs, signal => work(draft, signal))
      if (result.errors) sourceErrors[name] = `${result.errors} enrichissement(s) en échec`
    } catch (error) {
      sourceErrors[name] = error instanceof Error ? error.message : 'Enrichissement indisponible'
    }
    // Capture completed items; late responses only mutate the detached draft.
    candidates = structuredClone(draft)
    await checkpoint()
  }
  // 2026-10-08 : métriques d'abord (dénivelé puis durée, rapides et essentielles), descriptions
  // Gemini ensuite avec leur propre délai ; le géocodage du départ dépend de ces descriptions.
  if (input.sourceTypes.includes('ign')) await enrich('ign', (items, signal) => enrichCandidatesWithIgn(items, signal), IMPORT_IGN_TIMEOUT_MS)
  await enrich('duration', (items, signal) => enrichCandidatesWithDuration(items, signal))
  // Spec 019 AC-02-09 / AC-02-10 : photos Geotrek puis Camptocamp des randonnées qui n'en ont pas.
  await enrich('photos', (items, signal) => enrichCandidatesWithTrailPhotos(items, input.city, signal))
  if (input.sourceTypes.includes('gemini')) {
    await enrich('gemini_descriptions', (items, signal) => enrichCandidatesWithGeminiDescriptions(items, input.city, signal), IMPORT_DESCRIPTION_TIMEOUT_MS)
  }
  for (const candidate of candidates) {
    if (!candidate.start_label && candidate.description) candidate.start_label = extractStartLabelFromDescription(candidate.description)
  }
  await enrich('start_geocoding', (items, signal) => enrichCandidatesWithStartGeocoding(items, input.city, signal))
  return { candidates, source_errors: sourceErrors }
}

const OVERPASS_FALLBACK_ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]

// 2026-10-08 : un 500 du serveur principal arrêtait tout sans essayer les secours ; seule une requête
// invalide (400) est définitive, tout autre échec passe au serveur suivant.
const DEFINITIVE_HTTP_STATUSES = new Set([400])

async function fetchOverpassPayload(input: RunSourceInput, signal: AbortSignal): Promise<OverpassPayload> {
  const primary = process.env.OVERPASS_API_URL
  if (!primary) throw new Error('OVERPASS_API_URL non configurée')

  const radiusMeters = Math.round((input.zoneRadiusKm ?? 15) * 1000)
  const query = `
    [out:json][timeout:18];
    (
      relation["route"="hiking"](around:${radiusMeters},${input.city.latitude},${input.city.longitude});
    );
    out geom;
  `

  const endpoints = [primary, ...OVERPASS_FALLBACK_ENDPOINTS.filter(url => url !== primary)]
  let lastError: Error | null = null

  for (let i = 0; i < endpoints.length; i += 1) {
    try {
      signal.throwIfAborted()
      return await runWithDeadline(Date.now() + 20_000, 20_000, attemptSignal =>
        postOverpass(endpoints[i], query, AbortSignal.any([signal, attemptSignal])),
      )
    } catch (error) {
      signal.throwIfAborted()
      lastError = error instanceof Error ? error : new Error(String(error))
      const status = readStatus(lastError)
      const isTransient = status === null || !DEFINITIVE_HTTP_STATUSES.has(status)
      const hasNextEndpoint = i < endpoints.length - 1
      if (!isTransient || !hasNextEndpoint) break
      await delay(500 * (i + 1))
    }
  }

  const reason = lastError?.message ?? 'Overpass failed'
  throw new Error(`OpenStreetMap indisponible (serveurs Overpass publics en échec : ${reason}) — relancez plus tard`)
}

async function postOverpass(endpoint: string, query: string, signal: AbortSignal): Promise<OverpassPayload> {
  const response = await fetch(endpoint, {
    signal,
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
