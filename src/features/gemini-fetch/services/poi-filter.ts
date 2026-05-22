import type { GeminiRawPoi } from '../types'

const CLOSED_KEYWORDS = ['fermé définitivement', 'closed', 'fermé', 'closed permanently']

function isClosed(poi: GeminiRawPoi): boolean {
  const nameLower = poi.name.toLowerCase()
  return CLOSED_KEYWORDS.some(kw => nameLower.includes(kw))
}

function hasRequiredFields(poi: GeminiRawPoi): boolean {
  return poi.name.trim().length > 0 && poi.address.trim().length > 0
}

function deduplicateKey(poi: GeminiRawPoi): string {
  return `${poi.name.trim().toLowerCase()}|${poi.address.trim().toLowerCase()}`
}

export function filterPois(pois: GeminiRawPoi[]): GeminiRawPoi[] {
  const seen = new Set<string>()
  const result: GeminiRawPoi[] = []

  for (const poi of pois) {
    if (!hasRequiredFields(poi)) continue  // AC-02-03
    if (isClosed(poi)) continue            // AC-02-01
    const key = deduplicateKey(poi)
    if (seen.has(key)) continue            // AC-02-02
    seen.add(key)
    result.push(poi)
  }

  return result
  // AC-02-04: geographic filtering delegated to Gemini prompt (radiusKm constraint)
}
