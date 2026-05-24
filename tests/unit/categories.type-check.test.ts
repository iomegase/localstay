import type { PoiDetail, HikingDetailData, PoiHours } from '@/features/categories/types'

describe('PoiDetail type shape', () => {
  it('accepts a valid PoiDetail object', () => {
    const detail: PoiDetail = {
      id: '1', name: 'Le Bistrot', slug: 'bistrot',
      description: null, address: '1 rue Test',
      latitude: 45.89, longitude: 6.71,
      phone: null, website: null,
      rating: 4.5, rating_count: 120,
      is_open_now: true, hours: null, photos: [],
      distance_km: null,
      category: { id: 'c1', name: 'Restaurants', slug: 'restaurants', icon: 'utensils' },
      subcategory: null, hiking_detail: null,
      merchant_offers: [],
    }
    expect(detail.name).toBe('Le Bistrot')
  })

  it('accepts a HikingDetailData object', () => {
    const hd: HikingDetailData = {
      difficulty: 'hard', duration_minutes: 270,
      distance_km: 11.0, elevation_gain_m: 650,
      starting_point: 'Parking', parking_info: null,
      kids_friendly: false, pets_friendly: true,
      best_season: ['summer'], gpx_url: null,
    }
    expect(hd.difficulty).toBe('hard')
  })

  it('accepts a PoiHours object', () => {
    const hours: PoiHours = {
      '0': null,
      '1': { open: '12:00', close: '14:30' },
    }
    expect(hours['1']).not.toBeNull()
  })
})
