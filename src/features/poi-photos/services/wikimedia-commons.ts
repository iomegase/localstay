import { z } from 'zod'

// Spec 101 US-02 : photos sous licence libre de Wikimedia Commons, avec leur crédit.
const API = 'https://commons.wikimedia.org/w/api.php'
const REQUEST_TIMEOUT_MS = 10_000
const MIN_WIDTH = 800
const DISPLAY_WIDTH = 1600
const MAX_DISTANCE_KM = 5
const MAX_PHOTOS = 5
const ACCEPTED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const HEADERS = { 'User-Agent': 'MyStay/0.1 (https://mystay.city; contact:dev@mystay.city)' }

export type CommonsPhoto = {
  photo_url: string
  author: string
  license: string
  license_url: string | null
  source_url: string
}

const searchSchema = z.object({
  query: z.object({ search: z.array(z.object({ title: z.string() })) }).optional(),
})
const metaValue = z.object({ value: z.union([z.string(), z.number()]) }).optional()
const infoSchema = z.object({
  query: z.object({
    pages: z.record(z.object({
      title: z.string(),
      coordinates: z.array(z.object({ lat: z.number(), lon: z.number() })).optional(),
      imageinfo: z.array(z.object({
        width: z.number(),
        mime: z.string(),
        thumburl: z.string().url().optional(),
        descriptionurl: z.string().url(),
        extmetadata: z.object({
          Artist: metaValue,
          LicenseShortName: metaValue,
          LicenseUrl: metaValue,
          ImageDescription: metaValue,
          ObjectName: metaValue,
        }).partial(),
      })).optional(),
    })),
  }).optional(),
})

/** Spec 101 AC-02-02 : CC0, domaine public, CC BY, CC BY-SA — jamais NC ni ND. */
export function isAcceptedLicense(license: string): boolean {
  const value = license.trim().toUpperCase()
  if (/\bNC\b|\bND\b|NON-?COMMERCIAL|NO-?DERIV/.test(value)) return false
  return /^CC0\b/.test(value) || /^PUBLIC DOMAIN\b|^PD\b/.test(value) || /^CC BY(-SA)?( \d(\.\d)?)?\b/.test(value)
}

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

function distanceKm(a: { latitude: number; longitude: number }, b: { lat: number; lon: number }): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(b.lat - a.latitude)
  const dLng = toRad(b.lon - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

async function getJson(params: Record<string, string>): Promise<unknown> {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '1', origin: '*', ...params })}`
  const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), cache: 'no-store' })
  if (!response.ok) throw new Error(`COMMONS_HTTP_${response.status}`)
  return response.json()
}

/**
 * Spec 101 AC-02-01 à 04 : jusqu'à 5 photos Commons dont le titre ou la description contient le nom
 * exact du lieu, sous licence libre ; géolocalisées à 5 km au plus du POI, ou, sans position, citant
 * la ville (homonymes : « Le Terrier », « SPAR »…). Liste vide si Commons est indisponible.
 */
export async function findCommonsPhotos(poi: { name: string; latitude: number; longitude: number; city: string }): Promise<CommonsPhoto[]> {
  const name = normalize(poi.name)
  const city = normalize(poi.city)
  if (name.length < 3) return []
  try {
    const search = searchSchema.parse(await getJson({
      action: 'query', list: 'search', srnamespace: '6', srlimit: '20', srsearch: `"${poi.name.replace(/"/g, '')}" filetype:bitmap`,
    }))
    const titles = (search.query?.search ?? []).map(result => result.title)
    if (titles.length === 0) return []

    const info = infoSchema.parse(await getJson({
      action: 'query', titles: titles.join('|'), prop: 'imageinfo|coordinates',
      iiprop: 'url|size|mime|extmetadata', iiurlwidth: String(DISPLAY_WIDTH),
    }))
    const pages = Object.values(info.query?.pages ?? {})
    const byTitle = new Map(pages.map(page => [page.title, page]))
    const photos: CommonsPhoto[] = []
    for (const title of titles) {
      const page = byTitle.get(title)
      const image = page?.imageinfo?.[0]
      if (!page || !image?.thumburl || image.width < MIN_WIDTH || !ACCEPTED_MIME.has(image.mime)) continue
      const meta = image.extmetadata
      const license = String(meta.LicenseShortName?.value ?? '')
      if (!isAcceptedLicense(license)) continue
      const text = normalize(`${title} ${stripHtml(String(meta.ObjectName?.value ?? ''))} ${stripHtml(String(meta.ImageDescription?.value ?? ''))}`)
      if (!` ${text} `.includes(` ${name} `)) continue
      const position = page.coordinates?.[0]
      if (position ? distanceKm(poi, position) > MAX_DISTANCE_KM : !` ${text} `.includes(` ${city} `)) continue
      const author = stripHtml(String(meta.Artist?.value ?? '')) || 'Auteur inconnu'
      const licenseUrl = String(meta.LicenseUrl?.value ?? '')
      photos.push({
        photo_url: image.thumburl,
        author: author.slice(0, 120),
        license,
        license_url: /^https?:\/\//.test(licenseUrl) ? licenseUrl : null,
        source_url: image.descriptionurl,
      })
      if (photos.length >= MAX_PHOTOS) break
    }
    return photos
  } catch (error) {
    console.warn('[poi-photos] Wikimedia Commons indisponible :', error instanceof Error ? error.message : error)
    return []
  }
}
