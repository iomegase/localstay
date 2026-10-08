import { z } from 'zod'

// Spec 094 : sources d'une description (site officiel, pages citées par Gemini).

export type DescriptionSource = { url: string; title: string }

export const MAX_DESCRIPTION_SOURCES = 8

export const DescriptionSourceSchema = z.object({
  url: z.string().trim().url().max(2048).refine(value => /^https?:\/\//i.test(value), 'URL http(s) requise'),
  title: z.string().trim().min(1).max(200),
})

export const DescriptionSourcesSchema = z.array(DescriptionSourceSchema).max(MAX_DESCRIPTION_SOURCES)

const DOMAIN = /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i
const GOOGLE_REDIRECT_HOST = 'vertexaisearch.cloud.google.com'

/** BR-01 / BR-02 : nettoie une liste brute (lien durable, titre par défaut, sans doublon, 8 au plus). */
export function sanitizeDescriptionSources(raw: unknown): DescriptionSource[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const sources: DescriptionSource[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const { url, title } = item as { url?: unknown; title?: unknown }
    if (typeof url !== 'string') continue
    let parsed: URL
    try {
      parsed = new URL(url.trim())
    } catch {
      continue
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') continue
    const cleanTitle = typeof title === 'string' ? title.trim().slice(0, 200) : ''
    let finalUrl = parsed.toString()
    if (parsed.hostname === GOOGLE_REDIRECT_HOST) {
      if (!DOMAIN.test(cleanTitle)) continue
      finalUrl = `https://${cleanTitle.toLowerCase()}`
    }
    if (seen.has(finalUrl)) continue
    seen.add(finalUrl)
    sources.push({ url: finalUrl, title: cleanTitle || new URL(finalUrl).hostname.replace(/^www\./, '') })
    if (sources.length >= MAX_DESCRIPTION_SOURCES) break
  }
  return sources
}
