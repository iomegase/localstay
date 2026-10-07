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

const passy = { id: 'city-passy', latitude: 45.9214, longitude: 6.6906 }

describe('spec 092 — changer la ville d’un POI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCityFindFirst.mockResolvedValue({ id: 'city-passy' })
    mockCategoryFindFirst.mockResolvedValue({ id: 'cat-1' })
    mockSubCategoryFindFirst.mockResolvedValue(null)
    mockCityFindUnique.mockResolvedValue({ latitude: passy.latitude, longitude: passy.longitude })
    mockPoiFindMany.mockResolvedValue([])
    mockGeocodeForAcquisition.mockResolvedValue({ status: 'success', latitude: 45.9105, longitude: 6.7195, confidence: 0.98 })
    mockTransaction.mockImplementation(async callback => callback({
      pointOfInterest: { findFirst: mockPoiFindFirst, update: mockPoiUpdate },
      poiAcquisitionAuditLog: { create: mockAuditCreate },
      poiCityRedirect: { upsert: mockRedirectUpsert },
    }))
  })

  const move = () => updateAdminPoi('poi-1', { city_id: 'city-passy', force_geocode: false, confirm_geocode_pending_review: false }, 'admin-1')

  it('AC-01 / AC-05 : rattache le POI, recalcule depuis le centre de la nouvelle ville, audit', async () => {
    mockPoiFindFirst.mockResolvedValue(poiRow())
    mockPoiUpdate.mockResolvedValue(poiRow({ city_id: 'city-passy' }))
    await move()

    expect(mockCityFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'city-passy', is_active: true, deleted_at: null } }))
    expect(mockGeocodeForAcquisition).toHaveBeenCalledWith(address, { latitude: passy.latitude, longitude: passy.longitude })
    expect(mockPoiUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ city: { connect: { id: 'city-passy' } }, latitude: 45.9105, longitude: 6.7195 }),
    }))
    expect(mockPoiUpdate.mock.calls[0][0].data).not.toHaveProperty('slug')
    expect(mockAuditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'poi_updated' }) }))
  })

  it('AC-03 / BR-02 : enregistre la redirection de l’ancienne adresse vers le POI', async () => {
    mockPoiFindFirst.mockResolvedValue(poiRow())
    mockPoiUpdate.mockResolvedValue(poiRow({ city_id: 'city-passy' }))
    await move()
    expect(mockRedirectUpsert).toHaveBeenCalledWith({
      where: { from_city_id_from_slug: { from_city_id: 'city-1', from_slug: 'musee-art-sacre' } },
      create: { from_city_id: 'city-1', from_slug: 'musee-art-sacre', poi_id: 'poi-1' },
      update: { poi_id: 'poi-1', deleted_at: null },
    })
  })

  it('AC-02 : slug déjà pris dans la ville cible → premier suffixe libre', async () => {
    mockPoiFindFirst.mockResolvedValue(poiRow())
    mockPoiFindMany.mockResolvedValue([{ slug: 'musee-art-sacre' }, { slug: 'musee-art-sacre-2' }])
    mockPoiUpdate.mockResolvedValue(poiRow())
    await move()
    expect(mockPoiUpdate.mock.calls[0][0].data.slug).toBe('musee-art-sacre-3')
  })

  it('AC-01 : adresse hors zone de la nouvelle ville → refus, rien n’est modifié', async () => {
    mockPoiFindFirst.mockResolvedValue(poiRow())
    mockGeocodeForAcquisition.mockResolvedValue({ status: 'rejected', reason: 'out_of_range' })
    await expect(move()).rejects.toMatchObject({ code: 'MAPBOX_GEOCODE_FAILED' })
    expect(mockPoiUpdate).not.toHaveBeenCalled()
    expect(mockRedirectUpsert).not.toHaveBeenCalled()
  })

  it('BR-01 : ville inactive ou inconnue refusée', async () => {
    mockPoiFindFirst.mockResolvedValue(poiRow())
    mockCityFindFirst.mockResolvedValue(null)
    await expect(move()).rejects.toMatchObject({ code: 'INVALID_CITY' })
    expect(mockPoiUpdate).not.toHaveBeenCalled()
  })

  it('sans changement de ville : ni redirection ni géocodage', async () => {
    mockCityFindFirst.mockResolvedValue({ id: 'city-1' })
    mockPoiFindFirst.mockResolvedValue(poiRow())
    mockPoiUpdate.mockResolvedValue(poiRow())
    await updateAdminPoi('poi-1', { city_id: 'city-1', name: 'Musée', force_geocode: false, confirm_geocode_pending_review: false }, 'admin-1')
    expect(mockGeocodeForAcquisition).not.toHaveBeenCalled()
    expect(mockRedirectUpsert).not.toHaveBeenCalled()
  })
})
