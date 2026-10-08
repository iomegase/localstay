import { Prisma } from '@prisma/client'
import { parseAdminPoiPatchInput } from '@/features/admin-pois/lib/admin-poi-rules'
const mockPoiFindFirst = jest.fn()
const mockPoiUpdate = jest.fn()
const mockCityFindFirst = jest.fn()
const mockCategoryFindFirst = jest.fn()
const mockSubCategoryFindFirst = jest.fn()
const mockAuditCreate = jest.fn()
const mockTransaction = jest.fn()
const mockGeocodeForAcquisition = jest.fn()
const mockCityFindUnique = jest.fn()
const mockPoiFindMany = jest.fn()
const mockRedirectUpsert = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: {
      findFirst: (...args: unknown[]) => mockPoiFindFirst(...args),
      update: (...args: unknown[]) => mockPoiUpdate(...args),
      findMany: (...args: unknown[]) => mockPoiFindMany(...args),
    },
    city: {
      findFirst: (...args: unknown[]) => mockCityFindFirst(...args),
      findUniqueOrThrow: (...args: unknown[]) => mockCityFindUnique(...args),
    },
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

describe('spec 094 AC-05 — sources enregistrées avec la fiche', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCityFindFirst.mockResolvedValue({ id: 'city-1' })
    mockCategoryFindFirst.mockResolvedValue({ id: 'cat-1' })
    mockSubCategoryFindFirst.mockResolvedValue(null)
    mockPoiFindFirst.mockResolvedValue(poiRow())
    mockPoiUpdate.mockResolvedValue(poiRow())
    mockTransaction.mockImplementation(async callback => callback({
      pointOfInterest: { findFirst: mockPoiFindFirst, update: mockPoiUpdate },
      poiAcquisitionAuditLog: { create: mockAuditCreate },
    }))
  })

  const save = (description_sources: unknown) => updateAdminPoi('poi-1', { description_sources, force_geocode: false, confirm_geocode_pending_review: false } as never, 'admin-1')

  it('enregistre les sources nettoyées ; liste vide → colonne vidée ; champ absent → inchangé', async () => {
    await save([{ url: 'https://www.combloux.com/', title: 'Office de tourisme' }])
    expect(mockPoiUpdate.mock.calls[0][0].data.description_sources).toEqual([{ url: 'https://www.combloux.com/', title: 'Office de tourisme' }])
    await save([])
    expect(mockPoiUpdate.mock.calls[1][0].data.description_sources).toBe(Prisma.JsonNull)
    await updateAdminPoi('poi-1', { name: 'Musée', force_geocode: false, confirm_geocode_pending_review: false }, 'admin-1')
    expect(mockPoiUpdate.mock.calls[2][0].data).not.toHaveProperty('description_sources')
  })

  it('PATCH : sources non http(s) ou plus de 8 refusées', () => {
    expect(parseAdminPoiPatchInput({ description_sources: [{ url: 'javascript:alert(1)', title: 'x' }] }).success).toBe(false)
    expect(parseAdminPoiPatchInput({ description_sources: Array.from({ length: 9 }, (_, i) => ({ url: `https://s${i}.fr/`, title: 'S' })) }).success).toBe(false)
    expect(parseAdminPoiPatchInput({ description_sources: [{ url: 'https://ok.fr/', title: 'OK' }] }).success).toBe(true)
  })
})
