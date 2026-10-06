import { getPoiFallbackImage } from '@/features/categories/lib/poi-fallback-image'

export const MYSTAY_DEFAULT_IMAGE = '/og-mystay.png'

/**
 * Spec 065 AC-03-03 : sans photo réelle, la carte affiche l'image du type de lieu
 * (sous-catégorie puis catégorie), à défaut l'image MyStay. Elle reste décorative.
 */
export function resolveDiscoveryCardPhoto(
  photos: string[],
  categorySlug: string,
  subcategory: { slug: string; name: string } | null,
): { photo_url: string; photo_is_fallback: boolean } {
  const photo = photos[0]
  if (photo) return { photo_url: photo, photo_is_fallback: false }

  return {
    photo_url: getPoiFallbackImage(categorySlug, subcategory?.slug ?? null) ?? MYSTAY_DEFAULT_IMAGE,
    photo_is_fallback: true,
  }
}
