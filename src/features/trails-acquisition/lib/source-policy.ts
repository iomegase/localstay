import { TrailsAcquisitionError } from './errors'

const GEMINI_ALLOWED_KEYS = ['title', 'description', 'start_label', 'source_refs'] as const

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
