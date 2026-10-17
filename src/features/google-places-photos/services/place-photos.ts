import { z } from 'zod'

// Spec 103 : photos Google Maps demandées à chaque affichage, jamais stockées (BR-01).
const PLACES_API = 'https://places.googleapis.com/v1'
const MAX_PHOTOS = 3
const MAX_WIDTH_PX = 1200
const TIMEOUT_MS = 8_000

export type GooglePlacePhoto = {
  url: string
  width: number
  height: number
  authors: Array<{ name: string; uri: string | null }>
}

const detailsSchema = z.object({
  photos: z.array(z.object({
    name: z.string().regex(/^places\/[\w-]+\/photos\/[\w-]+$/),
    widthPx: z.number().optional(),
    heightPx: z.number().optional(),
    authorAttributions: z.array(z.object({ displayName: z.string().optional(), uri: z.string().optional() })).optional(),
  })).optional(),
})
const mediaSchema = z.object({ photoUri: z.string().url() })

/**
 * Spec 103 AC-01-01 à 03 : jusqu'à 3 photos du lieu (URL Google temporaires) avec leurs auteurs.
 * Liste vide si Google n'en renvoie pas ou en cas d'erreur (AC-01-04).
 */
export async function fetchGooglePlacePhotos(placeId: string): Promise<GooglePlacePhoto[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey || !/^[\w-]+$/.test(placeId)) return []
  try {
    const response = await fetch(`${PLACES_API}/places/${placeId}`, {
      headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'photos.name,photos.widthPx,photos.heightPx,photos.authorAttributions' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    })
    if (!response.ok) return []
    const details = detailsSchema.safeParse(await response.json())
    const photos = details.success ? (details.data.photos ?? []).slice(0, MAX_PHOTOS) : []

    const resolved = await Promise.all(photos.map(async photo => {
      const media = await fetch(`${PLACES_API}/${photo.name}/media?maxWidthPx=${MAX_WIDTH_PX}&skipHttpRedirect=true`, {
        headers: { 'X-Goog-Api-Key': apiKey },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: 'no-store',
      }).catch(() => null)
      const parsed = media?.ok ? mediaSchema.safeParse(await media.json()) : null
      if (!parsed?.success) return null
      return {
        url: parsed.data.photoUri,
        width: photo.widthPx ?? MAX_WIDTH_PX,
        height: photo.heightPx ?? Math.round(MAX_WIDTH_PX * 0.75),
        authors: (photo.authorAttributions ?? []).flatMap(author => author.displayName
          ? [{ name: author.displayName, uri: author.uri && /^https?:\/\//.test(author.uri) ? author.uri : author.uri?.startsWith('//') ? `https:${author.uri}` : null }]
          : []),
      }
    }))
    return resolved.filter((photo): photo is GooglePlacePhoto => photo !== null)
  } catch {
    return []
  }
}
