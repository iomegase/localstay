import { resolveDiscoveryCardPhoto } from '@/features/public-discovery/lib/discovery-photo'
import { getGuidePoiHeroImage } from '@/features/guide-app/lib/poi-image'
import { activeFallbackImageUrl, resolvePoiFallbackImage } from '@/features/categories/lib/poi-fallback-image'

// Spec 070 AC-02-05 / AC-02-06 : vraie photo > image attribuée > mots-clés > image MyStay.
const ASSIGNED = 'https://cdn.example/guide-photos/fallbacks/u1/1.webp'

describe('070 — ordre de priorité des images', () => {
  it('activeFallbackImageUrl ignore une image retirée', () => {
    expect(activeFallbackImageUrl({ url: ASSIGNED, deleted_at: null })).toBe(ASSIGNED)
    expect(activeFallbackImageUrl({ url: ASSIGNED, deleted_at: new Date() })).toBeNull()
    expect(activeFallbackImageUrl(null)).toBeNull()
  })

  it('resolvePoiFallbackImage : image attribuée, sinon mots-clés', () => {
    expect(resolvePoiFallbackImage(ASSIGNED, 'shopping', 'location-de-ski')).toBe(ASSIGNED)
    expect(resolvePoiFallbackImage(null, 'shopping', 'location-de-ski')).toBe('/fallback/fallback-location-de-ski.png')
  })

  it('/decouvrir : vraie photo, puis image attribuée, puis mots-clés, puis MyStay', () => {
    expect(resolveDiscoveryCardPhoto(['https://x/a.jpg'], 'shopping', null, ASSIGNED)).toEqual({ photo_url: 'https://x/a.jpg', photo_is_fallback: false })
    expect(resolveDiscoveryCardPhoto([], 'shopping', null, ASSIGNED)).toEqual({ photo_url: ASSIGNED, photo_is_fallback: true })
    expect(resolveDiscoveryCardPhoto([], 'shopping', null, null)).toEqual({ photo_url: '/fallback/fallback-shopping.png', photo_is_fallback: true })
    expect(resolveDiscoveryCardPhoto([], 'soin', null, null)).toEqual({ photo_url: '/og-mystay.png', photo_is_fallback: true })
  })

  it('guide : vraie photo, puis image attribuée, puis mots-clés', () => {
    expect(getGuidePoiHeroImage({ categorySlug: 'shopping', photos: ['https://x/a.jpg'], fallbackImageUrl: ASSIGNED })).toBe('https://x/a.jpg')
    expect(getGuidePoiHeroImage({ categorySlug: 'shopping', photos: [], fallbackImageUrl: ASSIGNED })).toBe(ASSIGNED)
    expect(getGuidePoiHeroImage({ categorySlug: 'shopping', photos: [] })).toBe('/fallback/fallback-shopping.png')
  })
})
