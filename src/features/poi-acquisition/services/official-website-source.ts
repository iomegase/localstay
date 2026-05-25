export type OfficialWebsiteSourceContext = {
  source_url: string
  attribution: string
  text: string
}

const MAX_SOURCE_TEXT_LENGTH = 12_000
const MAX_SOURCE_LINKS = 60

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
        'user-agent': 'StayLocalBot/1.0 official-poi-acquisition',
      },
      signal: controller.signal,
    })

    if (!response.ok) return null

    const contentType = response.headers.get('content-type') ?? ''
    if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      return null
    }

    const html = await response.text()
    const text = buildSourceText(html, url)
    if (!text) return null

    return {
      source_url: url.toString(),
      attribution: url.hostname,
      text,
    }
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
  const links = extractLinks(html, sourceUrl)
  const bodyText = cleanHtml(html)
  const linkText = links.map(link => `${link.label} — ${link.url}`).join('\n')
  return [linkText, bodyText]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, MAX_SOURCE_TEXT_LENGTH)
    .trim()
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
  return decodeHtml(html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
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
