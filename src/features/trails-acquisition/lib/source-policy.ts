import { TrailsAcquisitionError } from './errors'

// Gemini sans grounding : on n'autorise que les champs éditoriaux (pas de hallucinations chiffrées).
// Gemini avec Google Search grounding : on autorise désormais les métriques factuelles
// (extraites de sources web réelles type visorando/camptocamp via la recherche). L'admin
// valide en revue, et les valeurs sont marquées metric_source='gemini_grounded' pour traçabilité.
const GEMINI_ALLOWED_KEYS = [
  'title',
  'description',
  'source_refs',
  'start_label',
  'distance_km',
  'elevation_gain_m',
  'estimated_duration_min',
  'difficulty',
] as const

export function assertAllowedTrailSource(url: string): true {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new TrailsAcquisitionError('SOURCE_NOT_ALLOWED', 400)
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new TrailsAcquisitionError('SOURCE_NOT_ALLOWED', 400)
  }

  if (parsed.hostname.toLowerCase().includes('alltrails')) {
    throw new TrailsAcquisitionError('SOURCE_NOT_ALLOWED', 400)
  }

  return true
}

export function rejectGeminiGeoMetrics(candidate: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    GEMINI_ALLOWED_KEYS
      .filter(key => Object.prototype.hasOwnProperty.call(candidate, key))
      .map(key => [key, candidate[key]]),
  )
}
