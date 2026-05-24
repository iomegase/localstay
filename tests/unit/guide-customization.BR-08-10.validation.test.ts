import {
  filterValidCategoryOrder,
  groupFeaturedPoisByCategory,
  isPoiWithinGuideScope,
} from '@/features/guide-customization/lib/validation'

describe('guide customization validation — 012', () => {
  it('BR-10: isolates unknown or inactive category slugs and keeps valid order', () => {
    const result = filterValidCategoryOrder(
      ['restaurants', 'ghost', 'activities', 'inactive'],
      new Set(['restaurants', 'activities']),
    )

    expect(result.category_order).toEqual(['restaurants', 'activities'])
    expect(result.ignored_category_slugs).toEqual(['ghost', 'inactive'])
  })

  it('BR-08/09: accepts active nearby POIs and rejects out-of-scope POIs', () => {
    expect(isPoiWithinGuideScope({
      city_id: 'city-1',
      lodging_city_id: 'city-1',
      is_active: true,
      deleted_at: null,
      geocode_status: 'success',
      distance_km: 29.9,
    })).toBe(true)

    expect(isPoiWithinGuideScope({
      city_id: 'city-1',
      lodging_city_id: 'city-1',
      is_active: true,
      deleted_at: null,
      geocode_status: 'rejected',
      distance_km: 31,
    })).toBe(false)
  })

  it('BR-03: enforces maximum 5 featured POIs per category', () => {
    expect(() => groupFeaturedPoisByCategory([
      { poi_id: '1', category_id: 'restaurants', sort_order: 0 },
      { poi_id: '2', category_id: 'restaurants', sort_order: 1 },
      { poi_id: '3', category_id: 'restaurants', sort_order: 2 },
      { poi_id: '4', category_id: 'restaurants', sort_order: 3 },
      { poi_id: '5', category_id: 'restaurants', sort_order: 4 },
      { poi_id: '6', category_id: 'restaurants', sort_order: 5 },
    ])).toThrow('FEATURED_POI_LIMIT_EXCEEDED')
  })
})
