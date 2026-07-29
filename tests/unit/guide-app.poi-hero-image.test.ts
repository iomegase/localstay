import { getGuidePoiHeroImage } from '@/features/guide-app/lib/poi-image'

describe('GuideApp POI hero image', () => {
  it('prefers a real gallery image over a fallback', () => {
    expect(
      getGuidePoiHeroImage({
        categorySlug: 'diner',
        photos: [
          '/fallback/fallback-restaurant.png',
          'https://example.com/admin-hero.jpg',
          'https://example.com/gallery-2.jpg',
        ],
      }),
    ).toBe('https://example.com/admin-hero.jpg')
  })

  it('keeps the first real photo selected by the admin', () => {
    expect(
      getGuidePoiHeroImage({
        categorySlug: 'culture',
        photos: [
          'https://example.com/selected.jpg',
          'https://example.com/other.jpg',
        ],
      }),
    ).toBe('https://example.com/selected.jpg')
  })

  it('uses the category fallback only without a real gallery', () => {
    expect(
      getGuidePoiHeroImage({
        categorySlug: 'diner',
        photos: [],
      }),
    ).toBe('/fallback/fallback-restaurant.png')
  })
})
