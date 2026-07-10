import { PoiAcquisitionError } from '../lib/errors'
import { fetchOfficialWebsiteSourceContext } from './official-website-source'

export type ManualPoiSourceSuggestion = {
  source_url: string
  website: string
  name: string | null
  address: string | null
  phone: string | null
  description: string | null
}

const MAX_DESCRIPTION_LENGTH = 700

export async function suggestManualPoiFromSourceUrl(sourceUrl: string): Promise<ManualPoiSourceSuggestion> {
  const context = await fetchOfficialWebsiteSourceContext(sourceUrl)
  if (!context) {
    throw new PoiAcquisitionError('SOURCE_URL_UNREADABLE', 422)
  }

  const lines = splitUsefulLines(context.text)

  return {
    source_url: context.source_url,
    website: context.source_url,
    name: inferName(lines, context.attribution),
    address: inferAddress(context.text),
    phone: inferFrenchPhone(context.text),
    description: inferDescription(lines),
  }
}

function splitUsefulLines(text: string): string[] {
  return text
    .split(/\n+/)
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(line => line.length >= 3)
}

function inferName(lines: string[], attribution: string): string | null {
  const title = lines[0]
  if (!title) return null

  const hostTokens = attribution
    .replace(/^www\./, '')
    .split('.')
    .filter(token => token.length > 2)

  const cleaned = title
    .split(/\s(?:[-–—|•·]|::)\s/)
    .map(part => part.trim())
    .find(part => part.length >= 3 && !hostTokens.some(token => part.toLowerCase().includes(token.toLowerCase())))
    ?? title

  return limitText(cleaned, 160)
}

function inferAddress(text: string): string | null {
  const normalized = text.replace(/\s+/g, ' ')
  const streetPattern = /\b\d{1,4}\s+(?:bis\s+|ter\s+)?(?:rue|avenue|av\.?|chemin|chem\.?|route|rte\.?|place|impasse|allee|allée|boulevard|bd\.?|quai|montee|montée)\s+[^,.;|]{3,90}(?:,?\s+\d{5}\s+[A-ZÀ-ÿ][^,.;|]{2,60})?/i
  const match = normalized.match(streetPattern)?.[0]
  return match ? limitText(match.trim(), 255) : null
}

function inferFrenchPhone(text: string): string | null {
  const match = text.match(/(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}/)
  return match ? match[0].replace(/\s+/g, ' ').trim() : null
}

function inferDescription(lines: string[]): string | null {
  const candidate = lines
    .filter(line => !/^https?:\/\//i.test(line))
    .find(line => line.length >= 80)
    ?? lines.find(line => line.length >= 40)

  return candidate ? limitText(candidate, MAX_DESCRIPTION_LENGTH) : null
}

function limitText(value: string, maxLength: number): string {
  const trimmed = value.trim()
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1).trim()}…` : trimmed
}

