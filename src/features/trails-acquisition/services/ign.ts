type IgnProfilePoint = {
  z?: number
  alti?: number
  elevation?: number
}

type IgnProfile = {
  points?: IgnProfilePoint[]
  elevations?: IgnProfilePoint[]
}

const IGN_ENDPOINT = 'https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevationLine.json'
const IGN_MAX_POINTS = 50

export async function fetchIgnElevationProfile(coordinates: Array<[number, number]>): Promise<IgnProfile> {
  if (coordinates.length < 2) return { elevations: [] }

  const sampled = sampleCoordinates(coordinates, IGN_MAX_POINTS)
  const lon = sampled.map(c => c[0].toFixed(6)).join(',')
  const lat = sampled.map(c => c[1].toFixed(6)).join(',')

  const url = new URL(IGN_ENDPOINT)
  url.searchParams.set('lon', lon)
  url.searchParams.set('lat', lat)
  url.searchParams.set('resource', 'ign_rge_alti_wld')
  url.searchParams.set('delimiter', ',')
  url.searchParams.set('indent', 'false')
  url.searchParams.set('measures', 'false')
  url.searchParams.set('zonly', 'false')

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'StayLocal/0.1 contact:dev@staylocal.dev',
    },
  })

  if (!response.ok) throw new Error(`IGN HTTP ${response.status}`)
  return await response.json() as IgnProfile
}

function sampleCoordinates(coordinates: Array<[number, number]>, maxPoints: number): Array<[number, number]> {
  if (coordinates.length <= maxPoints) return coordinates
  const step = (coordinates.length - 1) / (maxPoints - 1)
  const sampled: Array<[number, number]> = []
  for (let i = 0; i < maxPoints; i += 1) {
    sampled.push(coordinates[Math.round(i * step)])
  }
  return sampled
}

type Candidate = {
  geometry_geojson?: unknown
  elevation_gain_m?: number | null
  elevation_status?: string
  metric_source?: string | null
}

const IGN_TIMEOUT_MS = 10_000
const IGN_CONCURRENCY = 5

export async function enrichCandidatesWithIgn<T extends Candidate>(candidates: T[]): Promise<{ enriched: number; errors: number }> {
  let enriched = 0
  let errors = 0

  const toEnrich = candidates.filter(c => extractLineStringCoordinates(c.geometry_geojson).length >= 2)

  await mapWithConcurrency(toEnrich, IGN_CONCURRENCY, async candidate => {
    const coordinates = extractLineStringCoordinates(candidate.geometry_geojson)
    try {
      const profile = await withTimeout(fetchIgnElevationProfile(coordinates), IGN_TIMEOUT_MS)
      const result = deriveElevationFromIgnProfile(profile)
      if (result.elevation_status === 'valid') {
        candidate.elevation_gain_m = result.elevation_gain_m
        candidate.elevation_status = 'valid'
        candidate.metric_source = result.metric_source
        enriched += 1
      }
    } catch {
      errors += 1
    }
  })

  return { enriched, errors }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout ${ms}ms`)), ms)
    promise.then(value => { clearTimeout(timer); resolve(value) }, err => { clearTimeout(timer); reject(err) })
  })
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

function extractLineStringCoordinates(geometry: unknown): Array<[number, number]> {
  if (!geometry || typeof geometry !== 'object') return []
  const geo = geometry as { type?: string; coordinates?: unknown }
  if (!Array.isArray(geo.coordinates)) return []

  if (geo.type === 'LineString') return toCoordList(geo.coordinates)
  if (geo.type === 'MultiLineString') {
    // Concaténer tous les segments pour l'enrichissement IGN (profil global)
    return geo.coordinates.flatMap(line => (Array.isArray(line) ? toCoordList(line) : []))
  }
  return []
}

function toCoordList(values: unknown[]): Array<[number, number]> {
  return values.flatMap(pair => {
    if (
      Array.isArray(pair) &&
      typeof pair[0] === 'number' &&
      typeof pair[1] === 'number' &&
      Number.isFinite(pair[0]) &&
      Number.isFinite(pair[1])
    ) {
      return [[pair[0], pair[1]] as [number, number]]
    }
    return []
  })
}

export function deriveElevationFromIgnProfile(profile: IgnProfile): {
  elevation_gain_m: number | null
  elevation_status: 'valid' | 'missing'
  metric_source: 'ign' | null
} {
  const points = profile.points ?? profile.elevations ?? []
  const elevations = points.map(readElevation).filter((value): value is number => value !== null)
  if (elevations.length < 2) {
    return { elevation_gain_m: null, elevation_status: 'missing', metric_source: null }
  }

  let gain = 0
  for (let index = 1; index < elevations.length; index += 1) {
    const delta = elevations[index] - elevations[index - 1]
    if (delta > 0) gain += delta
  }

  return { elevation_gain_m: Math.round(gain), elevation_status: 'valid', metric_source: 'ign' }
}

function readElevation(point: IgnProfilePoint): number | null {
  const value = point.z ?? point.alti ?? point.elevation
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}
