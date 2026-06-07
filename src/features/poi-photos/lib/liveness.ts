/** Une photo est "morte" si la réponse n'est pas un 2xx, ou n'est pas une image. */
export function isDeadPhotoResponse(input: { status: number; contentType: string | null }): boolean {
  const { status, contentType } = input
  if (status < 200 || status >= 300) return true
  if (!contentType || !contentType.toLowerCase().startsWith('image/')) return true
  return false
}

/** Retire les URLs mortes d'une liste de photos (ordre préservé). */
export function removeDeadPhotos(photos: string[], deadUrls: string[]): string[] {
  const dead = new Set(deadUrls)
  return photos.filter(url => !dead.has(url))
}

/** Garde anti-abus : n'agir que sur une URL déjà présente dans le POI. */
export function belongsToPoi(photos: string[], url: string): boolean {
  return photos.includes(url)
}
