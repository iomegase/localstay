export const GUIDE_PHOTOS_BUCKET = 'guide-photos'
const PUBLIC_MARKER = `/storage/v1/object/public/${GUIDE_PHOTOS_BUCKET}/`

// Spec 070 AC-04-01 / BR-06 : seuls ces dossiers sont nettoyés ; jamais `fallbacks/`.
export const CLEANABLE_PREFIXES = ['pois/', 'lodgings/'] as const

/** Chemin dans le bucket `guide-photos`, ou null hors bucket. */
export function guidePhotoPath(url: string): string | null {
  const index = url.indexOf(PUBLIC_MARKER)
  if (index === -1) return null
  const path = url.slice(index + PUBLIC_MARKER.length).split('?')[0]!
  try {
    return decodeURIComponent(path)
  } catch {
    return path
  }
}

export function isCleanableStoragePath(path: string): boolean {
  return CLEANABLE_PREFIXES.some(prefix => path.startsWith(prefix))
}

/** Chemin nettoyable d'une URL, ou null (autre bucket, autre dossier, URL externe). */
export function cleanablePath(url: string): string | null {
  const path = guidePhotoPath(url)
  return path && isCleanableStoragePath(path) ? path : null
}

export function removedUrls(before: string[], after: string[]): string[] {
  const kept = new Set(after)
  return before.filter(url => !kept.has(url))
}
