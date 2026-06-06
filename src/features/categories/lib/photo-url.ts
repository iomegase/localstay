export function selectPrimaryPoiPhoto(photos: string[]): string | null {
  return photos.find(isRenderablePoiPhotoUrl) ?? null
}

function isRenderablePoiPhotoUrl(url: string): boolean {
  if (!url) return false

  try {
    const parsed = new URL(url)
    const path = parsed.pathname.toLowerCase()

    if (!['http:', 'https:'].includes(parsed.protocol)) return false
    if (path.includes('favicon')) return false
    if (path.includes('aucune-image')) return false
    if (path.includes('no-image')) return false
    if (path.includes('placeholder')) return false
    if (path.includes('/blank/')) return false
    if (/(?:^|[\/_.+\-%])logo(?:$|[\/_.+\-%])/.test(path)) return false

    return true
  } catch {
    return false
  }
}
