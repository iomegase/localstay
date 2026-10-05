/** Spec 063 — URL hébergées par le stockage Supabase public du projet (copies MyStay). */
export function isMyStayStorageUrl(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base || !url) return false
  try {
    const parsed = new URL(url)
    return parsed.hostname === new URL(base).hostname
      && parsed.pathname.startsWith('/storage/v1/object/public/')
  } catch {
    return false
  }
}

/** Photo d'origine tierce : URL http(s) absolue qui n'est pas une copie MyStay. */
export function isThirdPartyPhotoUrl(url: string): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && !isMyStayStorageUrl(url)
  } catch {
    return false
  }
}
