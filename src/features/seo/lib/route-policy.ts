const LODGING_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Routes invitées réservées à un séjour actif (cookie de séjour). Sans séjour,
// seules ces routes affichent l'écran « Accès par lien » ; toute autre URL
// inconnue atteint le 404 de Next (audit SEO/GEO 2026-10-05, C-03).
const PRIVATE_GUEST_ROOT_PATHS = [
  '/sejour',
  '/le-logement',
  '/map',
  '/mes-favoris',
  '/nos-recommandations',
  '/services-prives',
  '/contact',
] as const

export function isPrivateGuestPath(pathname: string): boolean {
  return PRIVATE_GUEST_ROOT_PATHS.some(root => pathname === root || pathname.startsWith(`${root}/`))
}

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
