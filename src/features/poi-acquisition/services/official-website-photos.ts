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

export async function fetchOfficialWebsitePhotoEnrichment(
  website: string | null,
): Promise<OfficialWebsitePhotoEnrichment | null> {
  if (!website) return null

  const canonicalUrl = normalizeCanonicalUrl(website)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(canonicalUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'StayLocalBot/1.0 official-poi-photo-enrichment',
      },
      signal: controller.signal,
    })

    if (!response.ok) return null

    const contentType = response.headers.get('content-type') ?? ''
    if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      return null
    }

    const enrichment = extractOfficialWebsitePhotoEnrichment(await response.text(), canonicalUrl)
    return enrichment.photos.length > 0 ? enrichment : null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
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
    const normalized = parsed.toString().toLowerCase()

    if (!['http:', 'https:'].includes(parsed.protocol)) return false
    if (normalized.includes('favicon')) return false
    if (normalized.includes('no-image')) return false
    if (normalized.includes('placeholder')) return false
    if (normalized.includes('/blank/')) return false
    if (normalized.includes('logo')) return false
    if (normalized.endsWith('.svg')) return false

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
