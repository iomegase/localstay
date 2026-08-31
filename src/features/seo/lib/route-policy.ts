const LODGING_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const PRIVATE_GUIDE_ROOT_SEGMENTS = new Set([
  'agenda',
  'contact',
  'mes-favoris',
])

function guideSegments(pathname: string): string[] {
  return pathname.split('/').filter(Boolean)
}

export function isValidLodgingId(value: string | null | undefined): value is string {
  return typeof value === 'string' && LODGING_UUID_PATTERN.test(value)
}

export function isGuidePath(pathname: string): boolean {
  const segments = guideSegments(pathname)
  return segments[0] === 'guide' && Boolean(segments[1])
}

export function isGuideCityLanding(pathname: string): boolean {
  const segments = guideSegments(pathname)
  return isGuidePath(pathname) && segments.length === 2
}

export function isLegacyDiscoveryGuidePath(pathname: string): boolean {
  const segments = guideSegments(pathname)
  if (!isGuidePath(pathname) || segments.length > 4) return false
  if (segments.length === 2) return true

  const routeRoot = segments[2]
  return routeRoot !== 'logements' && !PRIVATE_GUIDE_ROOT_SEGMENTS.has(routeRoot)
}

export function isPrivateGuideCompatibilityPath(pathname: string): boolean {
  const segments = guideSegments(pathname)
  if (!isGuidePath(pathname) || segments.length < 3) return false

  return segments[2] !== 'logements'
}

export function hasValidLodgingCookie(
  cookieValue: string | null | undefined,
  expectedLodgingId?: string | null,
): boolean {
  if (!isValidLodgingId(cookieValue)) return false
  if (expectedLodgingId === undefined || expectedLodgingId === null) return true

  return (
    isValidLodgingId(expectedLodgingId) &&
    cookieValue.toLowerCase() === expectedLodgingId.toLowerCase()
  )
}
