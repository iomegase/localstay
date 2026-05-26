type SourceRef = { type: string; attribution: string; used_for: string[] }

type MergeableCandidate = {
  primary_source_type: string
  source_refs: unknown
  raw_payload: unknown
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
  geometry_geojson?: unknown
  metric_source?: string | null
  geometry_status?: string
  elevation_status?: string
  data_quality_status?: string
}

const STOP_WORDS = new Set([
  'le', 'la', 'les', 'l', 'du', 'de', 'des', 'd',
  'et', 'a', 'au', 'aux', 'sur', 'sous', 'depuis',
  'en', 'par', 'vers', 'via',
])

const SOURCE_PRIORITY: Record<string, number> = {
  overpass: 0,
  official_website: 1,
  gpx: 2,
  manual: 3,
  ign: 4,
  gemini: 5,
}

const SIMILARITY_THRESHOLD = 0.5

export function mergeDuplicateCandidates<T extends MergeableCandidate>(candidates: T[]): T[] {
  const merged = new Set<number>()
  const result: T[] = []

  for (let i = 0; i < candidates.length; i += 1) {
    if (merged.has(i)) continue
    const cluster: T[] = [candidates[i]]
    merged.add(i)

    for (let j = i + 1; j < candidates.length; j += 1) {
      if (merged.has(j)) continue
      if (titleSimilarity(candidates[i].title, candidates[j].title) >= SIMILARITY_THRESHOLD) {
        cluster.push(candidates[j])
        merged.add(j)
      }
    }

    result.push(mergeCluster(cluster))
  }

  return result
}

function mergeCluster<T extends MergeableCandidate>(cluster: T[]): T {
  // Trier par priorité factuelle (Overpass d'abord, Gemini dernier)
  const sorted = [...cluster].sort((a, b) => {
    const pa = SOURCE_PRIORITY[a.primary_source_type] ?? 99
    const pb = SOURCE_PRIORITY[b.primary_source_type] ?? 99
    return pa - pb
  })

  const base: T = { ...sorted[0] }
  const allRefs: SourceRef[] = []

  for (const candidate of sorted) {
    if (Array.isArray(candidate.source_refs)) {
      for (const ref of candidate.source_refs as unknown[]) {
        if (isSourceRef(ref)) allRefs.push(ref)
      }
    }
    fillMissingFields(base, candidate)
  }

  base.source_refs = dedupeRefs(allRefs)
  // Choisir le titre le plus long (souvent le plus descriptif)
  base.title = sorted.reduce((best, c) => (c.title.length > best.length ? c.title : best), base.title)

  return base
}

function fillMissingFields<T extends MergeableCandidate>(base: T, candidate: T): void {
  if (!base.description && candidate.description) base.description = candidate.description
  if (!base.start_label && candidate.start_label) base.start_label = candidate.start_label
  if (base.distance_km == null && candidate.distance_km != null) base.distance_km = candidate.distance_km
  if (base.elevation_gain_m == null && candidate.elevation_gain_m != null) {
    base.elevation_gain_m = candidate.elevation_gain_m
    base.elevation_status = candidate.elevation_status ?? base.elevation_status
  }
  if (base.estimated_duration_min == null && candidate.estimated_duration_min != null) {
    base.estimated_duration_min = candidate.estimated_duration_min
  }
  if (!base.geometry_geojson && candidate.geometry_geojson) {
    base.geometry_geojson = candidate.geometry_geojson
    base.geometry_status = candidate.geometry_status ?? base.geometry_status
  }
  if (base.start_latitude == null && candidate.start_latitude != null) base.start_latitude = candidate.start_latitude
  if (base.start_longitude == null && candidate.start_longitude != null) base.start_longitude = candidate.start_longitude
  if ((!base.difficulty || base.difficulty === 'unknown') && candidate.difficulty && candidate.difficulty !== 'unknown') {
    base.difficulty = candidate.difficulty
  }
  if (!base.loop_type && candidate.loop_type) base.loop_type = candidate.loop_type
}

function titleSimilarity(a: string, b: string): number {
  const tokensA = new Set(normalizeTitle(a))
  const tokensB = new Set(normalizeTitle(b))
  if (tokensA.size === 0 || tokensB.size === 0) return 0
  let intersection = 0
  for (const token of tokensA) if (tokensB.has(token)) intersection += 1
  const union = new Set([...tokensA, ...tokensB]).size
  return intersection / union
}

const DIACRITICS_RE = new RegExp('[̀-ͯ]', 'g')

function normalizeTitle(title: string): string[] {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOP_WORDS.has(token))
}

function isSourceRef(value: unknown): value is SourceRef {
  if (typeof value !== 'object' || value === null) return false
  const ref = value as Record<string, unknown>
  return typeof ref.type === 'string' && typeof ref.attribution === 'string' && Array.isArray(ref.used_for)
}

function dedupeRefs(refs: SourceRef[]): SourceRef[] {
  const byType = new Map<string, SourceRef>()
  for (const ref of refs) {
    const existing = byType.get(ref.type)
    if (!existing) {
      byType.set(ref.type, { ...ref, used_for: [...ref.used_for] })
    } else {
      const merged = new Set([...existing.used_for, ...ref.used_for])
      existing.used_for = [...merged]
    }
  }
  return [...byType.values()]
}
