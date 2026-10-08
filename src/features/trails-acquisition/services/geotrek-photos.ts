import { dedupeTrailPhotos, type TrailPhoto } from '../lib/photos'
import { isSamePlace, placeQueries } from '../lib/place-match'

/**
 * Spec 019 AC-02-10 (PO 2026-10-08) : photos des randonnées depuis le Geotrek du Département de la
 * Haute-Savoie (offices de tourisme, CEN 74…), chacune avec son auteur — crédit publié sur la page.
 */
const GEOTREK_API = 'https://geotrek.nature-haute-savoie.fr/api/v2'
const GEOTREK_SITE = 'https://rando.nature-haute-savoie.fr'
const HEADERS = { 'User-Agent': 'MyStay/1.0 (https://www.mystay.city)', Accept: 'application/json' }
const SEARCH_RADIUS_KM = 20
const MATCH_RADIUS_KM = 10
const MAX_PHOTOS = 8

type GeotrekAttachment = { type?: string; url?: string; author?: string | null; legend?: string | null; license?: string | null }
export type GeotrekTrek = { id: number; name: string; departure_geom?: [number, number] | null; attachments?: GeotrekAttachment[] }
type CityRef = { latitude: number; longitude: number }
type Candidate = { title: string; start_latitude?: number | null; start_longitude?: number | null }
export type GeotrekFetcher = (url: string, signal?: AbortSignal) => Promise<{ results?: GeotrekTrek[] }>

const defaultFetcher: GeotrekFetcher = async (url, signal) => {
  const response = await fetch(url, { headers: HEADERS, signal })
  if (!response.ok) throw new Error(`Geotrek HTTP ${response.status}`)
  return (await response.json()) as { results?: GeotrekTrek[] }
}

function distanceKm(a: [number, number], b: [number, number]): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const h = Math.sin(toRad(b[1] - a[1]) / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(toRad(b[0] - a[0]) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

export function geotrekPhotos(trek: GeotrekTrek): TrailPhoto[] {
  const sourceUrl = `${GEOTREK_SITE}/trek/${trek.id}`
  return dedupeTrailPhotos((trek.attachments ?? []).flatMap(attachment => {
    if (attachment.type !== 'image' || !attachment.url || !/^https:\/\//.test(attachment.url)) return []
    const author = attachment.author?.trim()
    return [{
      url: attachment.url,
      source_url: sourceUrl,
      attribution: author ? `${author} — Geotrek Haute-Savoie` : 'Geotrek Haute-Savoie',
      ...(attachment.legend?.trim() ? { caption: attachment.legend.trim() } : {}),
      ...(attachment.license?.trim() ? { license: attachment.license.trim() } : {}),
    }]
  })).slice(0, MAX_PHOTOS)
}

/** Une liste de randonnées Geotrek par run (une seule requête), puis correspondance par nom. */
export function createGeotrekPhotoFinder(city: CityRef, fetcher: GeotrekFetcher = defaultFetcher) {
  let treks: Promise<GeotrekTrek[]> | null = null
  const load = (signal?: AbortSignal) => {
    if (!treks) {
      const dLat = SEARCH_RADIUS_KM / 111
      const dLng = SEARCH_RADIUS_KM / (111 * Math.cos((city.latitude * Math.PI) / 180))
      const bbox = [city.longitude - dLng, city.latitude - dLat, city.longitude + dLng, city.latitude + dLat].map(value => value.toFixed(4)).join(',')
      treks = fetcher(`${GEOTREK_API}/trek/?format=json&language=fr&in_bbox=${bbox}&page_size=200&fields=id,name,attachments,departure_geom`, signal)
        .then(payload => payload.results ?? [])
    }
    return treks
  }

  return async (candidate: Candidate, signal?: AbortSignal): Promise<TrailPhoto[]> => {
    const origin: [number, number] = [candidate.start_longitude ?? city.longitude, candidate.start_latitude ?? city.latitude]
    const queries = placeQueries(candidate.title)
    for (const trek of await load(signal)) {
      if (trek.departure_geom && distanceKm(origin, trek.departure_geom) > MATCH_RADIUS_KM) continue
      const trekNames = placeQueries(trek.name)
      if (!queries.some(query => trekNames.some(name => isSamePlace(query, name)))) continue
      const photos = geotrekPhotos(trek)
      if (photos.length) return photos
    }
    return []
  }
}
