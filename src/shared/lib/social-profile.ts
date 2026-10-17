/**
 * Spec 098 BR-08 : un profil de réseau social n'est pas un site officiel lisible — connecté ou
 * non, la page ne livre qu'une coquille (« 868 Followers, 118 Posts… ») et une photo de profil.
 */
const SOCIAL_HOSTS = [
  'instagram.com', 'facebook.com', 'fb.com', 'fb.me', 'tiktok.com', 'twitter.com', 'x.com',
  'linktr.ee', 'linkedin.com', 'pinterest.com', 'pinterest.fr', 'youtube.com', 'youtu.be', 'threads.net',
]

export function isSocialProfileUrl(value: string | null | undefined): boolean {
  if (!value) return false
  try {
    const host = new URL(value).hostname.toLowerCase().replace(/^www\./, '')
    return SOCIAL_HOSTS.some(social => host === social || host.endsWith(`.${social}`))
  } catch {
    return false
  }
}
