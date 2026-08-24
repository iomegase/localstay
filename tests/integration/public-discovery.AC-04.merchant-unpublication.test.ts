const mockProfileFindFirst = jest.fn()
const mockPoiFindFirst = jest.fn()
const mockPoiUpdate = jest.fn()
const mockAuditCreate = jest.fn()
const mockTransaction = jest.fn()
const mockRevalidate = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    merchantProfile: { findFirst: (...args: unknown[]) => mockProfileFindFirst(...args) },
    pointOfInterest: {
      findFirst: (...args: unknown[]) => mockPoiFindFirst(...args),
      update: (...args: unknown[]) => mockPoiUpdate(...args),
    },
    $transaction: (callback: (tx: unknown) => unknown) => mockTransaction(callback),
  },
}))

jest.mock('@/features/public-discovery/lib/revalidation', () => ({
  safelyRevalidateDiscoveryPaths: (...args: unknown[]) => mockRevalidate(...args),
}))

import { updateMerchantDashboardProfile } from '@/features/merchant/queries/dashboard'

const publishedPoi = {
  id: 'poi-1',
  name: 'Adresse locale',
  slug: 'adresse-locale',
  description: 'Description complète',
  address: '1 rue du Mont-Blanc',
  latitude: 45.89,
  longitude: 6.71,
  phone: '+33450000000',
  website: null,
  hours: null,
  photos: ['https://example.com/poi.jpg'],
  is_active: true,
  deleted_at: null,
  geocode_status: 'success',
  discovery_status: 'PUBLISHED' as const,
  discovery_published_at: new Date('2026-08-20T15:00:00.000Z'),
  city: { id: 'city-1', slug: 'saint-gervais', is_active: true, deleted_at: null },
  category: { id: 'category-1', slug: 'manger', is_active: true, deleted_at: null },
  subcategory: null,
}

const profile = {
  id: 'profile-1',
  merchant_id: 'merchant-1',
  poi_id: 'poi-1',
  status: 'active',
  approved_claim_id: 'claim-1',
  poi: publishedPoi,
}

describe('041 AC-04-05 merchant mutation guard', () => {
  beforeEach(() => {
    mockProfileFindFirst.mockReset()
    mockPoiFindFirst.mockReset()
    mockPoiUpdate.mockReset()
    mockAuditCreate.mockReset()
    mockTransaction.mockReset()
    mockRevalidate.mockReset()
    mockProfileFindFirst.mockResolvedValue(profile)
    mockTransaction.mockImplementation(async callback => callback({
      pointOfInterest: { findFirst: mockPoiFindFirst, update: mockPoiUpdate },
      poiAcquisitionAuditLog: { create: mockAuditCreate },
    }))
  })

  it('atomically unpublishes and audits when a merchant empties the description', async () => {
    mockPoiFindFirst
      .mockResolvedValueOnce(publishedPoi)
      .mockResolvedValueOnce({ ...publishedPoi, description: null })
    mockPoiUpdate
      .mockResolvedValueOnce({ ...publishedPoi, description: null })
      .mockResolvedValueOnce({ discovery_status: 'DRAFT', discovery_published_at: null })

    const result = await updateMerchantDashboardProfile('merchant-1', { description: null })

    expect(mockTransaction).toHaveBeenCalledTimes(1)
    expect(result.poi.description).toBeNull()
    expect(mockPoiUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: 'poi-1' },
      data: { discovery_status: 'DRAFT', discovery_published_at: null },
      select: { discovery_status: true, discovery_published_at: true },
    })
    expect(mockAuditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        admin_id: 'merchant-1',
        actor_type: 'MERCHANT',
        action: 'poi_discovery_auto_unpublished',
        target_type: 'poi',
        target_id: 'poi-1',
        before: expect.objectContaining({ discovery_status: 'PUBLISHED' }),
        after: expect.objectContaining({ discovery_status: 'DRAFT' }),
      }),
    })
    expect(mockRevalidate).toHaveBeenCalledWith([
      '/decouvrir/saint-gervais',
      '/decouvrir/saint-gervais/manger',
      '/decouvrir/saint-gervais/manger/adresse-locale',
    ])
  })

  it('keeps an eligible published edit and revalidates without an auto-unpublication audit', async () => {
    mockPoiFindFirst
      .mockResolvedValueOnce(publishedPoi)
      .mockResolvedValueOnce({ ...publishedPoi, name: 'Nouveau nom' })
    mockPoiUpdate.mockResolvedValueOnce({ ...publishedPoi, name: 'Nouveau nom' })

    await updateMerchantDashboardProfile('merchant-1', { name: 'Nouveau nom' })

    expect(mockPoiUpdate).toHaveBeenCalledTimes(1)
    expect(mockAuditCreate).not.toHaveBeenCalled()
    expect(mockRevalidate).toHaveBeenCalledWith([
      '/decouvrir/saint-gervais',
      '/decouvrir/saint-gervais/manger',
      '/decouvrir/saint-gervais/manger/adresse-locale',
    ])
  })

  it('does not audit or revalidate a DRAFT POI', async () => {
    mockPoiFindFirst.mockResolvedValueOnce(null)
    mockPoiUpdate.mockResolvedValueOnce({ ...publishedPoi, discovery_status: 'DRAFT', name: 'Brouillon' })

    await updateMerchantDashboardProfile('merchant-1', { name: 'Brouillon' })

    expect(mockPoiFindFirst).toHaveBeenCalledTimes(1)
    expect(mockPoiUpdate).toHaveBeenCalledTimes(1)
    expect(mockAuditCreate).not.toHaveBeenCalled()
    expect(mockRevalidate).not.toHaveBeenCalled()
  })
})
