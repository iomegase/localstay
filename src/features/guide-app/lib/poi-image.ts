import { resolvePoiFallbackImage } from '@/features/categories/lib/poi-fallback-image'

export function getGuidePoiHeroImage({
  categorySlug,
  photos,
  fallbackImageUrl = null,
}: {
  categorySlug: string
  photos: string[]
  /** Spec 070 : image de remplacement attribuée au lieu. */
  fallbackImageUrl?: string | null
}): string {
  const realHero = photos.find(
    photo =>
      photo.trim().length > 0 &&
      !photo.startsWith('/fallback/'),
  )
  if (realHero) return realHero

  const existingFallback = photos.find(photo =>
    photo.startsWith('/fallback/'),
  )

  return (
    existingFallback ??
    resolvePoiFallbackImage(fallbackImageUrl, categorySlug, null) ??
    '/fallback/fallback-culture.png'
  )
}
