const mockPoiFindMany = jest.fn()
const mockPoiFindFirst = jest.fn()
const mockPoiUpdate = jest.fn()
const mockAuditCreate = jest.fn()
const mockTransaction = jest.fn()
const mockGeocodeAddress = jest.fn()
const mockValidateGeocode = jest.fn()
const mockRevalidate = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: {
      findMany: (...args: unknown[]) => mockPoiFindMany(...args),
      findFirst: (...args: unknown[]) => mockPoiFindFirst(...args),
      update: (...args: unknown[]) => mockPoiUpdate(...args),
    },
    poiAcquisitionAuditLog: { create: (...args: unknown[]) => mockAuditCreate(...args) },
    $transaction: (callback: (tx: unknown) => unknown) => mockTransaction(callback),
  },
}))

jest.mock('@/features/geocoding/services/mapbox-client', () => ({
  geocodeAddress: (...args: unknown[]) => mockGeocodeAddress(...args),
}))
jest.mock('@/features/geocoding/services/geo-validator', () => ({
  validateGeocode: (...args: unknown[]) => mockValidateGeocode(...args),
}))
jest.mock('@/features/public-discovery/lib/revalidation', () => ({
  safelyRevalidateDiscoveryPaths: (...args: unknown[]) => mockRevalidate(...args),
}))

import { runGeocodeBatch } from '@/features/geocoding/services/geocode-runner'

const batchPoi = {
  id: 'poi-1', address: '1 rue du Mont-Blanc',
  city: { latitude: 45.89, longitude: 6.71 },
}
const publishedPoi = {
  ...batchPoi,
  slug: 'adresse-locale', description: 'Description',
  latitude: 45.89, longitude: 6.71, phone: '+33450000000', website: null,
  photos: ['https://example.com/poi.jpg'], is_active: true, deleted_at: null,
  geocode_status: 'success', discovery_status: 'PUBLISHED',
  discovery_published_at: new Date('2026-08-20T15:00:00.000Z'),
  city: { id: 'city-1', slug: 'ville', latitude: 45.89, longitude: 6.71, is_active: true, deleted_at: null },
  category: { id: 'category-1', slug: 'categorie', is_active: true, deleted_at: null },
  subcategory: null,
}

describe('041 AC-04-05 geocoding mutation guard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPoiFindMany.mockResolvedValue([batchPoi])
    mockTransaction.mockImplementation(async callback => callback({
      pointOfInterest: { findFirst: mockPoiFindFirst, update: mockPoiUpdate },
      poiAcquisitionAuditLog: { create: mockAuditCreate },
    }))
    jest.spyOn(console, 'log').mockImplementation(() => undefined)
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => jest.restoreAllMocks())

  it('atomically withdraws with a SYSTEM audit when geocoding fails', async () => {
    mockGeocodeAddress.mockResolvedValue(null)
    mockPoiFindFirst
      .mockResolvedValueOnce(publishedPoi)
      .mockResolvedValueOnce({ ...publishedPoi, geocode_status: 'failed' })
    mockPoiUpdate
      .mockResolvedValueOnce({ id: 'poi-1' })
      .mockResolvedValueOnce({ discovery_status: 'DRAFT', discovery_published_at: null })

    await expect(runGeocodeBatch({ limit: 1 })).resolves.toEqual({
      geocoded: 0, failed: 1, rejected: 0, skipped: 0,
    })
    expect(mockAuditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ admin_id: null, actor_type: 'SYSTEM' }),
    })
    expect(mockRevalidate).toHaveBeenCalledWith([
      '/decouvrir/ville',
      '/decouvrir/ville/categorie',
      '/decouvrir/ville/categorie/adresse-locale',
    ])
  })

  it('keeps a valid published success and revalidates without withdrawing', async () => {
    const geocoded = {
      latitude: 45.9, longitude: 6.72, relevance: 0.9, place_name: 'Adresse',
    }
    mockGeocodeAddress.mockResolvedValue(geocoded)
    mockValidateGeocode.mockReturnValue({ valid: true })
    mockPoiFindFirst
      .mockResolvedValueOnce(publishedPoi)
      .mockResolvedValueOnce({ ...publishedPoi, latitude: 45.9, longitude: 6.72 })
    mockPoiUpdate.mockResolvedValueOnce({ id: 'poi-1' })

    const result = await runGeocodeBatch({ limit: 1 })

    expect(result.geocoded).toBe(1)
    expect(mockPoiUpdate).toHaveBeenCalledTimes(1)
    expect(mockAuditCreate).not.toHaveBeenCalled()
    expect(mockRevalidate).toHaveBeenCalledTimes(1)
  })

  it('does not audit or revalidate a DRAFT failure', async () => {
    mockGeocodeAddress.mockResolvedValue(null)
    mockPoiFindFirst.mockResolvedValue(null)
    mockPoiUpdate.mockResolvedValue({ id: 'poi-1' })

    await runGeocodeBatch({ limit: 1 })

    expect(mockAuditCreate).not.toHaveBeenCalled()
    expect(mockRevalidate).not.toHaveBeenCalled()
  })

  it('revalidates earlier committed POIs when a later reconciliation fails', async () => {
    mockPoiFindMany.mockResolvedValue([
      batchPoi,
      { ...batchPoi, id: 'poi-2', address: '2 rue du Mont-Blanc' },
    ])
    mockGeocodeAddress
      .mockResolvedValueOnce({
        latitude: 45.9,
        longitude: 6.72,
        relevance: 0.9,
        place_name: 'Adresse',
      })
      .mockRejectedValueOnce(new Error('Mapbox unavailable'))
    mockValidateGeocode.mockReturnValue({ valid: true })
    mockPoiFindFirst
      .mockResolvedValueOnce(publishedPoi)
      .mockResolvedValueOnce({ ...publishedPoi, latitude: 45.9, longitude: 6.72 })
    mockPoiUpdate.mockResolvedValueOnce({ id: 'poi-1' })
    mockTransaction
      .mockImplementationOnce(async callback => callback({
        pointOfInterest: { findFirst: mockPoiFindFirst, update: mockPoiUpdate },
        poiAcquisitionAuditLog: { create: mockAuditCreate },
      }))
      .mockRejectedValueOnce(new Error('failed to persist fallback'))

    await expect(runGeocodeBatch({ limit: 2 })).rejects.toThrow('failed to persist fallback')

    expect(mockRevalidate).toHaveBeenCalledWith([
      '/decouvrir/ville',
      '/decouvrir/ville/categorie',
      '/decouvrir/ville/categorie/adresse-locale',
    ])
  })
})
