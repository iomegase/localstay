const mockPoiFindFirst = jest.fn()
const mockPoiUpdate = jest.fn()
const mockCityFindFirst = jest.fn()
const mockCategoryFindFirst = jest.fn()
const mockSubCategoryFindFirst = jest.fn()
const mockAuditCreate = jest.fn()
const mockTransaction = jest.fn()
const mockGeocodeForAcquisition = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: {
      findFirst: (...args: unknown[]) => mockPoiFindFirst(...args),
      update: (...args: unknown[]) => mockPoiUpdate(...args),
    },
    city: { findFirst: (...args: unknown[]) => mockCityFindFirst(...args) },
    category: { findFirst: (...args: unknown[]) => mockCategoryFindFirst(...args) },
    subCategory: { findFirst: (...args: unknown[]) => mockSubCategoryFindFirst(...args) },
    poiAcquisitionAuditLog: { create: (...args: unknown[]) => mockAuditCreate(...args) },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

jest.mock('@/features/poi-acquisition/lib/geocode', () => ({
  geocodeForAcquisition: (...args: unknown[]) => mockGeocodeForAcquisition(...args),
}))

import { updateAdminPoi } from '@/features/admin-pois/queries/admin-pois'

const address = "25 Place de l'Église, Saint-Nicolas de Véroce, 74170 Saint-Gervais-les-Bains"

function poiRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'poi-1',
    name: "Musée d'Art Sacré",
    slug: 'musee-art-sacre',
    description: null,
    address,
    latitude: 45.86393,
    longitude: 6.71747,
    phone: null,
    website: null,
    photos: [],
    tags: [],
    is_active: true,
    deleted_at: null,
    geocode_status: 'success',
    geocode_provider: 'mapbox',
    geocoded_at: new Date('2026-05-20T08:00:00.000Z'),
    discovery_status: 'DRAFT',
    discovery_published_at: null,
    photos_status: 'ok',
    review_source: 'MANUAL',
    updated_at: new Date('2026-05-25T08:00:00.000Z'),
    city_id: 'city-1',
    category_id: 'cat-1',
    subcategory_id: null,
    city: {
      id: 'city-1',
      name: 'Saint-Gervais-les-Bains',
      slug: 'saint-gervais-les-bains',
      latitude: 45.8921,
      longitude: 6.7085,
      is_active: true,
      deleted_at: null,
    },
    category: { id: 'cat-1', name: 'Culture', slug: 'culture', is_active: true, deleted_at: null },
    subcategory: null,
    merchant_profile: null,
    trail_detail: null,
    ...overrides,
  }
}

describe('022 admin POI forced geocoding', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCityFindFirst.mockResolvedValue({ id: 'city-1' })
    mockCategoryFindFirst.mockResolvedValue({ id: 'cat-1' })
    mockSubCategoryFindFirst.mockResolvedValue(null)
    mockTransaction.mockImplementation(async callback => callback({
      pointOfInterest: { findFirst: mockPoiFindFirst, update: mockPoiUpdate },
      poiAcquisitionAuditLog: { create: mockAuditCreate },
    }))
  })

  it('AC-02-03: recalculates coordinates when force_geocode is true even if address text is unchanged', async () => {
    mockPoiFindFirst.mockResolvedValue(poiRow())
    mockGeocodeForAcquisition.mockResolvedValue({
      status: 'success',
      latitude: 45.89012,
      longitude: 6.71123,
      confidence: 0.99,
    })
    mockPoiUpdate.mockResolvedValue(poiRow({
      latitude: 45.89012,
      longitude: 6.71123,
    }))

    await updateAdminPoi('poi-1', {
      address,
      force_geocode: true,
      confirm_geocode_pending_review: false,
    }, 'admin-1')

    expect(mockGeocodeForAcquisition).toHaveBeenCalledWith(address, {
      latitude: 45.8921,
      longitude: 6.7085,
    })
    expect(mockPoiUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'poi-1' },
      data: expect.objectContaining({
        address,
        latitude: 45.89012,
        longitude: 6.71123,
        geocode_status: 'success',
        geocode_provider: 'mapbox',
      }),
    }))
  })
})
