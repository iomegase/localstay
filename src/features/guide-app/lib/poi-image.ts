import { getPoiFallbackImage } from '@/features/categories/lib/poi-fallback-image'

export function getGuidePoiHeroImage({
  categorySlug,
  photos,
}: {
  categorySlug: string
  photos: string[]
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
    getPoiFallbackImage(categorySlug, null) ??
    '/fallback/fallback-culture.png'
  )
}
