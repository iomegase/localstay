/**
 * Helpers YouTube — parse d'URL, construction d'embed/miniature, validation.
 *
 * On stocke toujours l'URL brute collée par l'owner ; l'extraction d'ID et la
 * dérivation des URL d'embed/miniature se font au moment du rendu.
 */

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
])

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/

function isVideoId(value: string | null | undefined): value is string {
  return typeof value === 'string' && VIDEO_ID.test(value)
}

/**
 * Extrait l'identifiant de vidéo (11 caractères) d'une URL YouTube.
 * Gère watch?v=, youtu.be/, /shorts/, /embed/ (avec ou sans paramètres).
 * Retourne null pour toute URL non-YouTube ou malformée.
 */
export function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim()
  if (trimmed === '') return null

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }

  const host = url.hostname
  if (!YOUTUBE_HOSTS.has(host)) return null

  if (host === 'youtu.be') {
    const id = url.pathname.slice(1)
    return isVideoId(id) ? id : null
  }

  const segments = url.pathname.split('/').filter(Boolean)

  if (segments[0] === 'watch') {
    const id = url.searchParams.get('v')
    return isVideoId(id) ? id : null
  }

  if ((segments[0] === 'shorts' || segments[0] === 'embed') && segments[1]) {
    return isVideoId(segments[1]) ? segments[1] : null
  }

  // /watch sans slug de path mais avec ?v=
  const vParam = url.searchParams.get('v')
  return isVideoId(vParam) ? vParam : null
}

/** URL d'embed sans cookie (confidentialité RGPD). */
export function youTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`
}

/** Miniature hqdefault, utilisée par la façade click-to-load. */
export function youTubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

/**
 * Normalise une URL YouTube saisie par l'owner :
 * - null / vide / blancs → null,
 * - URL YouTube valide → URL trimée,
 * - sinon → lève une erreur (URL non reconnue comme YouTube).
 */
export function normalizeYouTubeUrl(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed === '') return null
  if (extractYouTubeId(trimmed) === null) {
    throw new Error('INVALID_YOUTUBE_URL')
  }
  return trimmed
}
