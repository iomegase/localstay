import { camptocampImagePhotos, dedupeTrailPhotos, extractTrailPhotos, type TrailPhoto } from '../lib/photos'
import { mercatorXToLng, mercatorYToLat } from '../lib/projection'
import { createGeotrekPhotoFinder } from './geotrek-photos'
import { createTourismSitePhotoFinder } from './tourism-site-photos'
import { isSamePlace, placeQueries } from '../lib/place-match'

export { isSamePlace, normalizePlaceName, placeQueries } from '../lib/place-match'

/**
 * Spec 019 AC-02-09 (2026-10-08) : photos des randonnées qui n'en ont pas, depuis Camptocamp
 * (CC-BY-SA, créditées) — lieux associés d'un itinéraire, sinon lieu du même nom à 10 km au plus.
 * Mesuré sur un run réel (Les Contamines) : 3 → 21 randonnées sur 34 avec photos.
 */
const CAMPTOCAMP_API = 'https://api.camptocamp.org'
const HEADERS = { 'User-Agent': 'MyStay/1.0 (https://www.mystay.city)', Accept: 'application/json' }
const MAX_PHOTOS = 8
const MAX_ASSOCIATED_WAYPOINTS = 3
const MATCH_RADIUS_KM = 10
const CONCURRENCY = 4

type PhotoEnrichable = {
  title: string
  primary_source_type: string
  raw_payload: unknown
  start_latitude?: number | null
  start_longitude?: number | null
}

type CityRef = { latitude: number; longitude: number; tourism_site_url?: string | null }
type Fetcher = (path: string, signal?: AbortSignal) => Promise<Record<string, unknown>>

const defaultFetcher: Fetcher = async (path, signal) => {
  const response = await fetch(`${CAMPTOCAMP_API}${path}`, { headers: HEADERS, signal })
  if (!response.ok) throw new Error(`Camptocamp HTTP ${response.status}`)
  return (await response.json()) as Record<string, unknown>
}

function distanceKm(a: [number, number], b: [number, number]): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const h = Math.sin(toRad(b[1] - a[1]) / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(toRad(b[0] - a[0]) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

function waypointPosition(doc: Record<string, unknown>): [number, number] | null {
  const geometry = doc.geometry as { geom?: string | null } | undefined
  try {
    const point = JSON.parse(geometry?.geom ?? 'null') as { coordinates?: [number, number] } | null
    if (!point?.coordinates) return null
    return [mercatorXToLng(point.coordinates[0]), mercatorYToLat(point.coordinates[1])]
  } catch {
    return null
  }
}

async function waypointPhotos(id: number, fetcher: Fetcher, signal?: AbortSignal): Promise<TrailPhoto[]> {
  const detail = await fetcher(`/waypoints/${id}`, signal)
  const images = (detail.associations as { images?: unknown[] } | undefined)?.images ?? []
  return camptocampImagePhotos(images, `https://www.camptocamp.org/waypoints/${id}`)
}

export async function findCamptocampPhotos(
  candidate: PhotoEnrichable,
  city: CityRef,
  fetcher: Fetcher = defaultFetcher,
  signal?: AbortSignal,
): Promise<TrailPhoto[]> {
  // 1. Itinéraire Camptocamp sans image : photos de ses lieux associés (sommet, lac, refuge…).
  const raw = candidate.raw_payload as { associations?: { waypoints?: Array<{ document_id?: number }> } } | null
  const associated = candidate.primary_source_type === 'camptocamp' ? raw?.associations?.waypoints ?? [] : []
  if (associated.length) {
    const photos: TrailPhoto[] = []
    for (const waypoint of associated.slice(0, MAX_ASSOCIATED_WAYPOINTS)) {
      if (typeof waypoint.document_id === 'number') photos.push(...await waypointPhotos(waypoint.document_id, fetcher, signal))
      if (photos.length >= MAX_PHOTOS) break
    }
    if (photos.length) return dedupeTrailPhotos(photos).slice(0, MAX_PHOTOS)
  }

  // 2. Sinon : lieu Camptocamp du même nom, à 10 km au plus du départ (ou de la ville).
  const origin: [number, number] = [candidate.start_longitude ?? city.longitude, candidate.start_latitude ?? city.latitude]
  for (const query of placeQueries(candidate.title)) {
    const search = await fetcher(`/search?q=${encodeURIComponent(query)}&pl=fr&t=w&limit=5`, signal)
    const documents = ((search.waypoints as { documents?: Array<Record<string, unknown>> } | undefined)?.documents) ?? []
    for (const doc of documents) {
      const locales = (doc.locales as Array<{ title?: string }> | undefined) ?? []
      const position = waypointPosition(doc)
      if (!position || distanceKm(origin, position) > MATCH_RADIUS_KM) continue
      if (!locales.some(locale => locale.title && isSamePlace(query, locale.title))) continue
      const photos = await waypointPhotos(doc.document_id as number, fetcher, signal)
      if (photos.length) return photos.slice(0, MAX_PHOTOS)
    }
  }
  return []
}

type PhotoFinder = (candidate: PhotoEnrichable, signal?: AbortSignal) => Promise<TrailPhoto[]>

/**
 * Photos des randonnées sans photo : Geotrek du Département d'abord (auteurs crédités), puis
 * Camptocamp (spec 019 AC-02-09 / AC-02-10).
 */
export async function enrichCandidatesWithTrailPhotos<T extends PhotoEnrichable>(
  candidates: T[],
  city: CityRef,
  signal?: AbortSignal,
  finders: PhotoFinder[] = [
    createGeotrekPhotoFinder(city),
    // Spec 019 AC-02-12 : galeries de l'office de tourisme de la ville, si son site est renseigné.
    ...(city.tourism_site_url ? [createTourismSitePhotoFinder(city.tourism_site_url)] : []),
    (candidate, findSignal) => findCamptocampPhotos(candidate, city, defaultFetcher, findSignal),
  ],
): Promise<{ enriched: number; errors: number }> {
  const queue = candidates.filter(candidate => extractTrailPhotos(candidate.raw_payload).length === 0)
  let enriched = 0
  let errors = 0
  let next = 0
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (next < queue.length) {
      signal?.throwIfAborted()
      const candidate = queue[next++]!
      try {
        let photos: TrailPhoto[] = []
        for (const find of finders) {
          photos = await find(candidate, signal)
          if (photos.length) break
        }
        if (!photos.length) continue
        const payload = (candidate.raw_payload && typeof candidate.raw_payload === 'object' ? candidate.raw_payload : {}) as Record<string, unknown>
        candidate.raw_payload = { ...payload, acquired_photos: photos }
        enriched += 1
      } catch (error) {
        if (signal?.aborted) throw error
        errors += 1
      }
    }
  }))
  return { enriched, errors }
}

/** Compatibilité : Camptocamp seul (tests et appels existants). */
export function enrichCandidatesWithCamptocampPhotos<T extends PhotoEnrichable>(
  candidates: T[],
  city: CityRef,
  signal?: AbortSignal,
  fetcher: Fetcher = defaultFetcher,
): Promise<{ enriched: number; errors: number }> {
  return enrichCandidatesWithTrailPhotos(candidates, city, signal, [(candidate, findSignal) => findCamptocampPhotos(candidate, city, fetcher, findSignal)])
}
