// Spec 079 AC-02-03 : lien de réservation saisi sans préfixe ou en http → https.
export function normalizeExternalUrl(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return null
  if (/^https:\/\//i.test(trimmed)) return trimmed
  if (/^http:\/\//i.test(trimmed)) return `https://${trimmed.slice('http://'.length)}`
  return `https://${trimmed.replace(/^\/+/, '')}`
}

/** Le domaine doit ressembler à un vrai site (« airbnb.fr », pas « foo »). */
export function hasPublicHostname(value: string): boolean {
  try {
    return new URL(value).hostname.includes('.')
  } catch {
    return false
  }
}
