import { dedupeTrailPhotos, type TrailPhoto } from '../lib/photos'
import { isSamePlace, normalizePlaceName, placeQueries } from '../lib/place-match'
import { extractOfficialWebsiteTrailPhotos } from './official-website'

/**
 * Spec 019 AC-02-12 (PO 2026-10-08) : photos des galeries du site de l'office de tourisme de la ville
 * (`City.tourism_site_url`), retrouvées par le plan du site ; seules les photos avec un crédit d'auteur
 * sont gardées (crédit publié sur la page). Mesuré : 7 des 10 randonnées restantes ont une page.
 */
const HEADERS = { 'User-Agent': 'MyStay/1.0 (https://www.mystay.city)', Accept: 'text/html,application/xml' }
const MAX_SITEMAPS = 60
const MAX_PAGES = 20_000
const MAX_PHOTOS = 8
const TRAIL_PAGE = /randonn|itineraire|sentier|balade|promenade|boucle|hike|trek/i
// Pages d'hiver ou traduites : photos de neige ou doublons d'une page française.
const EXCLUDED_PAGE = /\/(winter|hiver|summer|en|de|it|nl|es)\/|english|raquette|ski-|snow/i

type Candidate = { title: string }
export type TextFetcher = (url: string, signal?: AbortSignal) => Promise<string>

const defaultFetcher: TextFetcher = async (url, signal) => {
  const response = await fetch(url, { headers: HEADERS, signal, redirect: 'follow' })
  if (!response.ok) throw new Error(`Office de tourisme HTTP ${response.status}`)
  return response.text()
}

/** Nom d'une page d'après son adresse : dernier segment, sans identifiant numérique ni langue. */
export function pageNameFromUrl(url: string): string {
  const segment = decodeURIComponent(new URL(url).pathname.replace(/\/+$/, '').split('/').pop() ?? '')
  return normalizePlaceName(segment.replace(/-fr-\d+$|-\d+$/, '').replace(/-/g, ' '))
}

export async function listTrailPages(siteUrl: string, fetcher: TextFetcher = defaultFetcher, signal?: AbortSignal): Promise<string[]> {
  const host = new URL(siteUrl).hostname
  const pages = new Set<string>()
  const queue = [`https://${host}/sitemap.xml`]
  let visited = 0
  while (queue.length && visited < MAX_SITEMAPS && pages.size < MAX_PAGES) {
    const xml = await fetcher(queue.shift()!, signal).catch(() => '')
    visited += 1
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(match => match[1]!.replace(/&amp;/g, '&'))
    if (xml.includes('<sitemapindex')) queue.push(...locs)
    else for (const loc of locs) {
      try {
        if (new URL(loc).hostname === host && TRAIL_PAGE.test(loc) && !EXCLUDED_PAGE.test(loc)) pages.add(loc)
      } catch {
        // adresse invalide ignorée
      }
    }
  }
  return [...pages]
}

export function createTourismSitePhotoFinder(siteUrl: string, fetcher: TextFetcher = defaultFetcher) {
  let pages: Promise<Array<{ url: string; names: string[] }>> | null = null
  const host = new URL(siteUrl).hostname
  return async (candidate: Candidate, signal?: AbortSignal): Promise<TrailPhoto[]> => {
    pages ??= listTrailPages(siteUrl, fetcher, signal).then(urls => urls.map(url => {
      const name = pageNameFromUrl(url)
      return { url, names: [name, ...placeQueries(name)] }
    }))
    const queries = placeQueries(candidate.title)
    const page = (await pages).find(item => queries.some(query => item.names.some(name => isSamePlace(query, name))))
    if (!page) return []
    const html = await fetcher(page.url, signal)
    // Condition PO : un crédit d'auteur, pas seulement le nom du site (image de partage générique).
    return dedupeTrailPhotos(extractOfficialWebsiteTrailPhotos(html, page.url).filter(photo => photo.attribution !== host)).slice(0, MAX_PHOTOS)
  }
}
