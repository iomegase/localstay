const MAX_OFFICIAL_PHOTOS = 12

export type OfficialWebsitePhotoEnrichment = {
  photos: string[]
  canonical_url: string
  attribution: string
}

export function extractOfficialWebsitePhotoEnrichment(
  html: string,
  pageUrl: string,
): OfficialWebsitePhotoEnrichment {
  const candidates: string[] = []

  candidates.push(...extractJsonLdImages(html))
  candidates.push(...extractMetaImages(html))
  candidates.push(...extractGlobalPostImages(html))
  candidates.push(...extractMarkupImages(html))

  const photos = dedupe(candidates.map(url => normalizeImageUrl(url, pageUrl)).filter(isUsableImageUrl))
    .slice(0, MAX_OFFICIAL_PHOTOS)

  return {
    photos,
    canonical_url: normalizeCanonicalUrl(pageUrl),
    attribution: attributionFromUrl(pageUrl),
  }
}

export type OfficialWebsitePhotoFetchResult =
  | { status: 'ok'; enrichment: OfficialWebsitePhotoEnrichment }
  | { status: 'no_website' }
  | { status: 'fetch_failed'; reason: string }
  | { status: 'not_html'; contentType: string }
  | { status: 'no_photos_extracted'; canonicalUrl: string }

const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

export async function fetchOfficialWebsitePhotoEnrichmentDetailed(
  website: string | null,
): Promise<OfficialWebsitePhotoFetchResult> {
  if (!website || website.trim() === '') return { status: 'no_website' }

  const canonicalUrl = normalizeCanonicalUrl(website)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  try {
    const response = await fetch(canonicalUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'user-agent': BROWSER_USER_AGENT,
      },
      redirect: 'follow',
      signal: controller.signal,
    })

    if (!response.ok) {
      return { status: 'fetch_failed', reason: `HTTP ${response.status}` }
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      return { status: 'not_html', contentType }
    }

    const enrichment = extractOfficialWebsitePhotoEnrichment(await response.text(), canonicalUrl)
    if (enrichment.photos.length === 0) {
      return { status: 'no_photos_extracted', canonicalUrl }
    }
    return { status: 'ok', enrichment }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    return { status: 'fetch_failed', reason }
  } finally {
    clearTimeout(timeout)
  }
}

export async function fetchOfficialWebsitePhotoEnrichment(
  website: string | null,
): Promise<OfficialWebsitePhotoEnrichment | null> {
  const result = await fetchOfficialWebsitePhotoEnrichmentDetailed(website)
  return result.status === 'ok' ? result.enrichment : null
}

export function mergeOfficialWebsitePhotos(existing: string[], officialPhotos: string[]): string[] {
  return dedupe([...existing, ...officialPhotos]).slice(0, MAX_OFFICIAL_PHOTOS)
}

function extractJsonLdImages(html: string): string[] {
  const scripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map(match => decodeHtml(match[1].trim()))

  return scripts.flatMap(script => {
    try {
      return collectImageValues(JSON.parse(script))
    } catch {
      return []
    }
  })
}

function collectImageValues(value: unknown, keyHint = ''): string[] {
  if (typeof value === 'string') {
    return isImageKey(keyHint) ? [value] : []
  }

  if (Array.isArray(value)) {
    return value.flatMap(item => collectImageValues(item, keyHint))
  }

  if (!value || typeof value !== 'object') {
    return []
  }

  const record = value as Record<string, unknown>
  const type = typeof record['@type'] === 'string' ? record['@type'].toLowerCase() : ''
  const images: string[] = []

  if (type.includes('imageobject')) {
    for (const key of ['url', 'contentUrl', 'thumbnailUrl']) {
      images.push(...collectImageValues(record[key], 'image'))
    }
  }

  for (const [key, child] of Object.entries(record)) {
    images.push(...collectImageValues(child, key))
  }

  return images
}

function extractMetaImages(html: string): string[] {
  return [...html.matchAll(/<meta\b[^>]+>/gi)]
    .map(match => match[0])
    .filter(tag => /(?:property|name)=["'](?:og:image|og:image:url|twitter:image|thumbnail)["']/i.test(tag))
    .map(tag => extractAttribute(tag, 'content'))
    .filter((url): url is string => Boolean(url))
}

function extractGlobalPostImages(html: string): string[] {
  return [...html.matchAll(/(?:["']post_image["']|post_image)\s*:\s*["']([^"']+)["']/gi)].map(match => match[1])
}

function extractMarkupImages(html: string): string[] {
  const imageTags = [...html.matchAll(/<img\b[^>]+>/gi)].map(match => match[0])
  const directUrls = imageTags.flatMap(tag =>
    ['src', 'data-src'].map(attribute => extractAttribute(tag, attribute)).filter((url): url is string => Boolean(url)),
  )
  const srcsetUrls = imageTags.flatMap(tag =>
    ['srcset', 'data-srcset']
      .map(attribute => extractAttribute(tag, attribute))
      .filter((srcset): srcset is string => Boolean(srcset))
      .flatMap(parseSrcset),
  )

  return [...directUrls, ...srcsetUrls]
}

function extractAttribute(tag: string, attribute: string): string | null {
  const pattern = new RegExp(`${attribute}=["']([^"']+)["']`, 'i')
  return tag.match(pattern)?.[1] ?? null
}

function parseSrcset(srcset: string): string[] {
  return srcset
    .split(',')
    .map(candidate => candidate.trim().split(/\s+/)[0])
    .filter(Boolean)
}

function normalizeImageUrl(rawUrl: string, pageUrl: string): string {
  const decoded = decodeHtml(rawUrl).replaceAll('\\/', '/').trim()

  try {
    return new URL(decoded, pageUrl).toString()
  } catch {
    return ''
  }
}

function normalizeCanonicalUrl(rawUrl: string): string {
  try {
    return new URL(rawUrl).toString()
  } catch {
    return new URL(`https://${rawUrl}`).toString()
  }
}

function attributionFromUrl(rawUrl: string): string {
  return new URL(normalizeCanonicalUrl(rawUrl)).hostname
}

function isUsableImageUrl(url: string): boolean {
  if (!url) return false

  try {
    const parsed = new URL(url)
    const path = parsed.pathname.toLowerCase()

    if (!['http:', 'https:'].includes(parsed.protocol)) return false
    if (path.includes('favicon')) return false
    if (path.includes('no-image')) return false
    if (path.includes('placeholder')) return false
    if (path.includes('/blank/')) return false
    // Filtre 'logo' restreint au path : on rejette /logo/ ou foo-logo.png, pas
    // toute URL contenant le mot 'logo' (ex: /vente-locale-de-logogeranium.jpg)
    if (/(?:^|\/)logo(?:[-_.]|\/)/.test(path)) return false
    if (path.endsWith('.svg')) return false

    return /\.(avif|gif|jpe?g|png|webp)(\?|$|\/)/i.test(parsed.pathname) || parsed.hostname === 'api.cloudly.space'
  } catch {
    return false
  }
}

function isImageKey(key: string): boolean {
  return /image|photo|thumbnail/i.test(key)
}

function dedupe(urls: string[]): string[] {
  return [...new Set(urls)]
}

function decodeHtml(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&#x2F;', '/')
    .replaceAll('&#x2f;', '/')
    .replaceAll('&quot;', '"')
    .replaceAll('&#039;', "'")
}
