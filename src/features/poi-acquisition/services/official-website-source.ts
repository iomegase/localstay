export type OfficialWebsiteSourceContext = {
  source_url: string
  attribution: string
  text: string
}

const MAX_SOURCE_TEXT_LENGTH = 12_000
const MAX_SOURCE_LINKS = 60

export function extractOfficialWebsiteSourceContext(
  html: string,
  pageUrl: string,
): OfficialWebsiteSourceContext {
  const canonicalUrl = normalizeCanonicalUrl(pageUrl)
  const url = new URL(canonicalUrl)
  return {
    source_url: canonicalUrl,
    attribution: url.hostname,
    text: buildSourceText(html, url),
  }
}

export async function fetchOfficialWebsiteSourceContext(
  sourceUrl: string | null | undefined,
): Promise<OfficialWebsiteSourceContext | null> {
  if (!sourceUrl) return null

  let url: URL
  try {
    url = new URL(sourceUrl)
  } catch {
    return null
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(url.toString(), {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'MyStayBot/1.0 official-poi-acquisition',
      },
      signal: controller.signal,
    })

    if (!response.ok) return null

    const contentType = response.headers.get('content-type') ?? ''
    if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      return null
    }

    const context = extractOfficialWebsiteSourceContext(await response.text(), url.toString())
    return context.text ? context : null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export function appendOfficialWebsiteSourceToPrompt(
  prompt: string,
  sourceContext: OfficialWebsiteSourceContext | null,
): string {
  if (!sourceContext) return prompt

  return `${prompt}

Source officielle fournie par le super-admin:
- URL: ${sourceContext.source_url}
- Attribution: ${sourceContext.attribution}

Consigne additionnelle:
- Priorise les POI explicitement présents dans l'extrait officiel ci-dessous.
- Si un lien officiel correspond à un POI, utilise cette URL dans le champ "website".
- N'invente pas de coordonnées GPS, distances, notes, photos ou horaires.

Extrait officiel nettoyé:
${sourceContext.text}`
}

function buildSourceText(html: string, sourceUrl: URL): string {
  const structuredText = [
    extractTitle(html),
    ...extractMetaDescriptions(html),
    ...extractJsonLdDescriptions(html),
  ]
    .filter((text): text is string => Boolean(text))
    .join('\n')
  const links = extractLinks(html, sourceUrl)
  const bodyText = cleanHtml(html)
  const linkText = links.map(link => `${link.label} — ${link.url}`).join('\n')
  return [structuredText, linkText, bodyText]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, MAX_SOURCE_TEXT_LENGTH)
    .trim()
}

function extractTitle(html: string): string | null {
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]
  return title ? normalizeText(title) : null
}

function extractMetaDescriptions(html: string): string[] {
  return [...html.matchAll(/<meta\b[^>]+>/gi)]
    .map(match => match[0])
    .filter(tag => {
      const key = extractAttribute(tag, 'name') ?? extractAttribute(tag, 'property')
      return key ? /^(description|og:description|twitter:description)$/i.test(key) : false
    })
    .map(tag => extractAttribute(tag, 'content'))
    .filter((value): value is string => Boolean(value))
    .map(normalizeText)
    .filter(Boolean)
}

function extractJsonLdDescriptions(html: string): string[] {
  return [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map(match => decodeHtml(match[1].trim()))
    .flatMap(script => {
      try {
        return collectDescriptionValues(JSON.parse(script))
      } catch {
        return []
      }
    })
    .map(normalizeText)
    .filter(Boolean)
}

function collectDescriptionValues(value: unknown, keyHint = ''): string[] {
  if (typeof value === 'string') {
    return keyHint.toLowerCase() === 'description' ? [value] : []
  }

  if (Array.isArray(value)) {
    return value.flatMap(item => collectDescriptionValues(item, keyHint))
  }

  if (!value || typeof value !== 'object') {
    return []
  }

  return Object.entries(value as Record<string, unknown>)
    .flatMap(([key, child]) => collectDescriptionValues(child, key))
}

function extractLinks(html: string, sourceUrl: URL): Array<{ label: string; url: string }> {
  const links: Array<{ label: string; url: string }> = []

  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const label = cleanHtml(match[2] ?? '')
    if (!label || label.length < 2) continue

    try {
      const url = new URL(decodeHtml(match[1] ?? ''), sourceUrl).toString()
      links.push({ label, url })
    } catch {
      // Ignore malformed links from third-party markup.
    }
  }

  return dedupeLinks(links).slice(0, MAX_SOURCE_LINKS)
}

function cleanHtml(html: string): string {
  return normalizeText(html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<header\b[\s\S]*?<\/header>/gi, ' ')
    .replace(/<aside\b[\s\S]*?<\/aside>/gi, ' ')
    .replace(/<form\b[\s\S]*?<\/form>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
  )
}

function dedupeLinks(links: Array<{ label: string; url: string }>): Array<{ label: string; url: string }> {
  const seen = new Set<string>()
  return links.filter(link => {
    const key = `${link.label.toLowerCase()}|${link.url}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function extractAttribute(tag: string, attribute: string): string | null {
  const pattern = new RegExp(`${attribute}=["']([^"']+)["']`, 'i')
  return tag.match(pattern)?.[1] ?? null
}

function normalizeCanonicalUrl(rawUrl: string): string {
  try {
    return new URL(rawUrl).toString()
  } catch {
    return new URL(`https://${rawUrl}`).toString()
  }
}

function normalizeText(value: string): string {
  return decodeHtml(value)
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeHtml(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&quot;', '"')
    .replaceAll('&#039;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&#x2F;', '/')
    .replaceAll('&#x2f;', '/')
}
