import { activeFallbackImageUrl } from '@/features/categories/lib/poi-fallback-image'
import { resolveDiscoveryCardPhoto } from '@/features/public-discovery/lib/discovery-photo'

type ThumbnailSource = {
  photos: string[]
  category: { slug: string }
  subcategory: { slug: string; name: string } | null
  fallback_image: { url: string; deleted_at: Date | null } | null
}

/**
 * Vignette d'un POI dans « Mes coups de cœur » (PO 2026-10-08) : même image que la carte
 * publique — photo (copie MyStay, spec 063), sinon image de remplacement (spec 070).
 */
export function ownerPoiThumbnail(
  poi: ThumbnailSource,
  resolvePhotoUrl: (url: string) => string,
): { photo_url: string; photo_is_fallback: boolean } {
  const card = resolveDiscoveryCardPhoto(poi.photos, poi.category.slug, poi.subcategory, activeFallbackImageUrl(poi.fallback_image))
  return card.photo_is_fallback ? card : { ...card, photo_url: resolvePhotoUrl(card.photo_url) }
}
