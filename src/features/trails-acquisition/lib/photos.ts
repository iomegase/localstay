import { z } from 'zod'

const photoUrl = z.string().url().refine(value => /^https?:\/\//i.test(value))
export const TrailPhotoSchema = z.object({
  url: photoUrl,
  source_url: photoUrl,
  attribution: z.string(),
  caption: z.string().optional(),
  license: z.string().optional(),
})
export type TrailPhoto = z.infer<typeof TrailPhotoSchema>

export function extractTrailPhotos(rawPayload: unknown): TrailPhoto[] {
  if (!isRecord(rawPayload)) return []
  const acquired = Array.isArray(rawPayload.acquired_photos)
    ? rawPayload.acquired_photos.flatMap(photo => {
      const parsed = TrailPhotoSchema.safeParse(photo)
      return parsed.success ? [parsed.data] : []
    }) : []
  if (acquired.length) return dedupeTrailPhotos(acquired)

  const associations = isRecord(rawPayload.associations) ? rawPayload.associations : null
  const images = Array.isArray(associations?.images) ? associations.images : []
  const documentType = rawPayload.type === 'o' ? 'outings' : 'routes'
  const sourceUrl = typeof rawPayload.source_url === 'string' ? rawPayload.source_url
    : `https://www.camptocamp.org/${documentType}/${rawPayload.document_id ?? ''}`
  return dedupeTrailPhotos(images.flatMap(image => {
    if (!isRecord(image) || typeof image.filename !== 'string' || !/^[\w.-]+$/.test(image.filename)) return []
    const author = typeof image.author === 'string' ? image.author : ''
    const locales = Array.isArray(image.locales) ? image.locales.filter(isRecord) : []
    const caption = locales.find(locale => locale.lang === 'fr')?.title ?? locales[0]?.title
    return [{
      url: `https://media.camptocamp.org/c2corg-active/${image.filename}`,
      source_url: sourceUrl,
      attribution: author ? `${author} — Camptocamp.org` : 'Camptocamp.org',
      ...(typeof caption === 'string' && caption ? { caption } : {}),
    }]
  }))
}

export function dedupeTrailPhotos(photos: TrailPhoto[]): TrailPhoto[] {
  const seen = new Set<string>()
  return photos.filter(photo => {
    if (seen.has(photo.url)) return false
    seen.add(photo.url)
    return true
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
