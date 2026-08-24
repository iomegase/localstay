import type {
  AdminPoiDiscoveryEligibility,
  AdminPoiDiscoveryStatus,
} from '@/features/admin-pois/types'

export type AdminPoiDiscoveryEligibilityKey = keyof AdminPoiDiscoveryEligibility['checks']

export type AdminPoiDiscoveryPublicationState = {
  status: AdminPoiDiscoveryStatus
  publishedAt: string | null
  publicUrl: string | null
  eligibility: AdminPoiDiscoveryEligibility
}

export const ADMIN_POI_DISCOVERY_ELIGIBILITY_KEYS = [
  'active',
  'city',
  'category',
  'subcategory',
  'description',
  'photo',
  'address',
  'geocode',
  'contact',
] as const satisfies readonly AdminPoiDiscoveryEligibilityKey[]

const ELIGIBILITY_KEY_SET = new Set<string>(ADMIN_POI_DISCOVERY_ELIGIBILITY_KEYS)
const DISCOVERY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function parseAdminPoiDiscoveryPublicationResponse(
  value: unknown,
  expectedPoiId: string,
): AdminPoiDiscoveryPublicationState | null {
  if (!isRecord(value) || !isRecord(value.data)) return null
  const data = value.data
  if (data.id !== expectedPoiId) return null
  if (data.discovery_status !== 'DRAFT' && data.discovery_status !== 'PUBLISHED') return null

  const eligibility = parseEligibility(data.eligibility)
  if (!eligibility) return null

  if (data.discovery_status === 'DRAFT') {
    if (data.discovery_published_at !== null || data.public_url !== null) return null
    return { status: 'DRAFT', publishedAt: null, publicUrl: null, eligibility }
  }

  if (!eligibility.eligible) return null
  if (!isCanonicalIsoDateTime(data.discovery_published_at)) return null
  if (!isCanonicalDiscoveryDetailPath(data.public_url)) return null

  return {
    status: 'PUBLISHED',
    publishedAt: data.discovery_published_at,
    publicUrl: data.public_url,
    eligibility,
  }
}

export function parseAdminPoiDiscoveryMissingKeys(
  value: unknown,
): AdminPoiDiscoveryEligibilityKey[] {
  if (!isRecord(value) || !isRecord(value.error) || !isRecord(value.error.details)) return []
  const missing = value.error.details.missing
  if (!Array.isArray(missing)) return []

  return missing.filter(
    (key): key is AdminPoiDiscoveryEligibilityKey => (
      typeof key === 'string' && ELIGIBILITY_KEY_SET.has(key)
    ),
  )
}

function parseEligibility(value: unknown): AdminPoiDiscoveryEligibility | null {
  if (!isRecord(value) || typeof value.eligible !== 'boolean' || !isRecord(value.checks)) {
    return null
  }

  const checks = {} as AdminPoiDiscoveryEligibility['checks']
  let allSatisfied = true
  for (const key of ADMIN_POI_DISCOVERY_ELIGIBILITY_KEYS) {
    const check = value.checks[key]
    if (typeof check !== 'boolean') return null
    checks[key] = check
    if (!check) allSatisfied = false
  }

  if (value.eligible !== allSatisfied) return null
  return { eligible: value.eligible, checks }
}

function isCanonicalIsoDateTime(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const date = new Date(value)
  return Number.isFinite(date.getTime()) && date.toISOString() === value
}

function isCanonicalDiscoveryDetailPath(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (value.includes('%') || value.includes('\\') || value.includes('?') || value.includes('#')) {
    return false
  }

  const segments = value.split('/')
  if (segments.length !== 5 || segments[0] !== '' || segments[1] !== 'decouvrir') return false
  return segments.slice(2).every(segment => DISCOVERY_SLUG_PATTERN.test(segment))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
