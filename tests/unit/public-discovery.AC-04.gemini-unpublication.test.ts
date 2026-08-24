const mockSubcategoryFindFirst = jest.fn()
const mockPoiFindFirst = jest.fn()
const mockPoiUpsert = jest.fn()
const mockPoiUpdate = jest.fn()
const mockAuditCreate = jest.fn()
const mockTransaction = jest.fn()
const mockRevalidate = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    subCategory: { findFirst: (...args: unknown[]) => mockSubcategoryFindFirst(...args) },
    pointOfInterest: {
      findFirst: (...args: unknown[]) => mockPoiFindFirst(...args),
      upsert: (...args: unknown[]) => mockPoiUpsert(...args),
      update: (...args: unknown[]) => mockPoiUpdate(...args),
    },
    poiAcquisitionAuditLog: { create: (...args: unknown[]) => mockAuditCreate(...args) },
    $transaction: (callback: (tx: unknown) => unknown) => mockTransaction(callback),
  },
}))

jest.mock('@/features/public-discovery/lib/revalidation', () => ({
  safelyRevalidateDiscoveryPaths: (...args: unknown[]) => mockRevalidate(...args),
}))

import { persistPois } from '@/features/gemini-fetch/services/poi-persister'

const incomingPoi = {
  name: 'Adresse locale',
  description: 'Description complète',
  address: '1 rue du Mont-Blanc',
  phone: '+33450000000',
  website: null,
  subcategory: null,
  hours: null,
  tags: ['local'],
}

const publishedPoi = {
  id: 'poi-1', slug: 'adresse-locale', ...incomingPoi,
  latitude: 45.89, longitude: 6.71,
  photos: ['https://example.com/poi.jpg'], is_active: true, deleted_at: null,
  geocode_status: 'success', discovery_status: 'PUBLISHED',
  discovery_published_at: new Date('2026-08-20T15:00:00.000Z'),
  city: { id: 'city-1', slug: 'ville', is_active: true, deleted_at: null },
  category: { id: 'category-1', slug: 'categorie', is_active: true, deleted_at: null },
  subcategory: null,
}

const context = {
  cityId: 'city-1', categoryId: 'category-1', cityLatitude: 45.89, cityLongitude: 6.71,
}

describe('041 AC-04-05 Gemini legacy mutation guard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSubcategoryFindFirst.mockResolvedValue(null)
    mockTransaction.mockImplementation(async callback => callback({
      pointOfInterest: {
        findFirst: mockPoiFindFirst,
        upsert: mockPoiUpsert,
        update: mockPoiUpdate,
      },
      poiAcquisitionAuditLog: { create: mockAuditCreate },
    }))
  })

  it('atomically withdraws and audits a published POI made incomplete by Gemini', async () => {
    mockPoiFindFirst
      .mockResolvedValueOnce(publishedPoi)
      .mockResolvedValueOnce({ ...publishedPoi, description: '', phone: null, website: null })
    mockPoiUpsert.mockResolvedValue({ id: 'poi-1' })
    mockPoiUpdate.mockResolvedValue({ discovery_status: 'DRAFT', discovery_published_at: null })

    await persistPois([{ ...incomingPoi, description: '', phone: null }], context)

    expect(mockTransaction).toHaveBeenCalledTimes(1)
    expect(mockAuditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        admin_id: null,
        actor_type: 'SYSTEM',
        action: 'poi_discovery_auto_unpublished',
      }),
    })
    expect(mockRevalidate).toHaveBeenCalledWith([
      '/decouvrir/ville',
      '/decouvrir/ville/categorie',
      '/decouvrir/ville/categorie/adresse-locale',
    ])
  })

  it('keeps a valid published update without a withdrawal audit', async () => {
    mockPoiFindFirst
      .mockResolvedValueOnce(publishedPoi)
      .mockResolvedValueOnce({ ...publishedPoi, description: 'Description mise à jour' })
    mockPoiUpsert.mockResolvedValue({ id: 'poi-1' })

    await persistPois([{ ...incomingPoi, description: 'Description mise à jour' }], context)

    expect(mockPoiUpdate).not.toHaveBeenCalled()
    expect(mockAuditCreate).not.toHaveBeenCalled()
    expect(mockRevalidate).toHaveBeenCalledTimes(1)
  })

  it('does not audit or revalidate a DRAFT upsert', async () => {
    mockPoiFindFirst.mockResolvedValue(null)
    mockPoiUpsert.mockResolvedValue({ id: 'poi-draft' })

    await persistPois([incomingPoi], context)

    expect(mockAuditCreate).not.toHaveBeenCalled()
    expect(mockRevalidate).not.toHaveBeenCalled()
  })
})
