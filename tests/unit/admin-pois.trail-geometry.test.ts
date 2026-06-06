const mockFindFirst = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: { pointOfInterest: { findFirst: (...a: unknown[]) => mockFindFirst(...a) } },
}))

import { getAdminPoi } from '@/features/admin-pois/queries/admin-pois'

const geometry = { type: 'LineString', coordinates: [[6.70, 45.80], [6.71, 45.81]] }

function row() {
  return {
    id: 'poi-1',
    name: 'Col de Voza',
    slug: 'col-de-voza',
    description: 'desc',
    address: 'Départ parking',
    latitude: 45.8,
    longitude: 6.7,
    phone: null,
    website: null,
    photos: [],
    tags: ['rando'],
    is_active: true,
    deleted_at: null,
    geocode_status: 'success',
    review_source: 'MANUAL',
    updated_at: new Date('2026-06-01T00:00:00Z'),
    city: { id: 'c1', name: 'Saint-Gervais', slug: 'saint-gervais-les-bains' },
    category: { id: 'cat1', name: 'Rando', slug: 'rando' },
    subcategory: null,
    merchant_profile: null,
    trail_detail: {
      id: 'td-1',
      deleted_at: null,
      difficulty: 'medium',
      distance_km: 4,
      elevation_gain_m: 300,
      estimated_duration_min: 120,
      geometry_geojson: geometry,
      start_latitude: 45.8,
      start_longitude: 6.7,
      data_quality_status: 'indicative',
    },
  }
}

describe('getAdminPoi — exposes trail geometry for the admin map', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns geometry, start coordinates and data_quality_status on trail_detail', async () => {
    mockFindFirst.mockResolvedValue(row())

    const detail = await getAdminPoi('poi-1')

    expect(detail?.trail_detail).toEqual(
      expect.objectContaining({
        difficulty: 'medium',
        geometry_geojson: geometry,
        start_latitude: 45.8,
        start_longitude: 6.7,
        data_quality_status: 'indicative',
      }),
    )
  })
})
