const mockPoiFindFirst = jest.fn()
const mockPoiUpdate = jest.fn()
const mockAuditCreate = jest.fn()
const mockTransaction = jest.fn()
const mockCityFindFirst = jest.fn()
const mockCategoryFindFirst = jest.fn()
const mockSubcategoryFindFirst = jest.fn()
const mockPoiFindMany = jest.fn()
const mockPoiCount = jest.fn()
const mockRunFindMany = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: {
      findFirst: (...args: unknown[]) => mockPoiFindFirst(...args),
      update: (...args: unknown[]) => mockPoiUpdate(...args),
      findMany: (...args: unknown[]) => mockPoiFindMany(...args),
      count: (...args: unknown[]) => mockPoiCount(...args),
    },
    poiAcquisitionAuditLog: { create: (...args: unknown[]) => mockAuditCreate(...args) },
    city: { findFirst: (...args: unknown[]) => mockCityFindFirst(...args) },
    category: { findFirst: (...args: unknown[]) => mockCategoryFindFirst(...args) },
    subCategory: { findFirst: (...args: unknown[]) => mockSubcategoryFindFirst(...args) },
    poiAcquisitionRun: { findMany: (...args: unknown[]) => mockRunFindMany(...args) },
    $transaction: (callback: (tx: unknown) => unknown) => mockTransaction(callback),
  },
}))

jest.mock('@/features/poi-acquisition/lib/geocode', () => ({
  geocodeForAcquisition: jest.fn(),
}))

jest.mock('@/features/poi-acquisition/services/official-website-photos', () => ({
  fetchOfficialWebsitePhotoEnrichmentDetailed: jest.fn(),
  mergeOfficialWebsitePhotos: jest.fn(),
}))

import { PoiAcquisitionError } from '@/features/poi-acquisition/lib/errors'
import { updatePoiDiscoveryPublication } from '@/features/public-discovery/queries/admin-publication'
import {
  deleteAdminPoi,
  disableAdminPoi,
  restoreAdminPoi,
  updateAdminPoi,
  getAdminPoi,
  listAdminPois,
} from '@/features/admin-pois/queries/admin-pois'

const completePoi = {
  id: 'poi-1',
  name: 'Brasserie du Mont-Blanc',
  slug: 'brasserie-du-mont-blanc',
  description: 'Une adresse locale complète.',
  address: '1 rue du Mont-Blanc',
  latitude: 45.89,
  longitude: 6.71,
  phone: '+33450000000',
  website: null,
  photos: ['https://example.com/brasserie.jpg'],
  is_active: true,
  deleted_at: null,
  geocode_status: 'success',
  discovery_status: 'DRAFT' as const,
  discovery_published_at: null,
  city: { id: 'city-1', slug: 'saint-gervais', is_active: true, deleted_at: null },
  category: { id: 'category-1', slug: 'manger', is_active: true, deleted_at: null },
  subcategory: null,
}

const completeAdminPoi = {
  ...completePoi,
  tags: [],
  review_source: 'MANUAL' as const,
  photos_status: 'ok',
  updated_at: new Date('2026-08-20T15:00:00.000Z'),
  city_id: 'city-1',
  category_id: 'category-1',
  subcategory_id: null,
  geocode_provider: 'mapbox',
  geocoded_at: new Date('2026-08-20T14:00:00.000Z'),
  city: {
    ...completePoi.city,
    name: 'Saint-Gervais',
    latitude: 45.89,
    longitude: 6.71,
  },
  category: { ...completePoi.category, name: 'Manger' },
  merchant_profile: null,
  trail_detail: null,
}

describe('041 AC-04 transactional publication query', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTransaction.mockImplementation(async callback => callback({
      pointOfInterest: {
        findFirst: mockPoiFindFirst,
        update: mockPoiUpdate,
      },
      poiAcquisitionAuditLog: { create: mockAuditCreate },
    }))
    mockPoiFindFirst.mockResolvedValue(completePoi)
    mockCityFindFirst.mockResolvedValue({ id: 'city-1' })
    mockCategoryFindFirst.mockResolvedValue({ id: 'category-1' })
    mockSubcategoryFindFirst.mockResolvedValue(null)
    mockPoiCount.mockResolvedValue(0)
    mockRunFindMany.mockResolvedValue([])
  })

  it('publishes with a fresh date and audit in the same transaction', async () => {
    mockPoiUpdate.mockImplementation(async ({ data }) => ({ ...completePoi, ...data }))

    const result = await updatePoiDiscoveryPublication('poi-1', 'PUBLISHED', 'admin-1')

    expect(mockTransaction).toHaveBeenCalledTimes(1)
    expect(mockPoiUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'poi-1' },
      data: {
        discovery_status: 'PUBLISHED',
        discovery_published_at: expect.any(Date),
      },
    }))
    expect(mockAuditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        admin_id: 'admin-1',
        action: 'poi_discovery_published',
        target_type: 'poi',
        target_id: 'poi-1',
        before: expect.objectContaining({ discovery_status: 'DRAFT' }),
        after: expect.objectContaining({ discovery_status: 'PUBLISHED' }),
      }),
    })
    expect(result).toEqual(expect.objectContaining({
      discovery_status: 'PUBLISHED',
      discovery_published_at: expect.any(String),
      public_url: '/decouvrir/saint-gervais/manger/brasserie-du-mont-blanc',
      eligibility: expect.objectContaining({ eligible: true }),
    }))
  })

  it('refuses an incomplete publication without update or audit', async () => {
    mockPoiFindFirst.mockResolvedValue({ ...completePoi, description: ' ', photos: [] })

    await expect(updatePoiDiscoveryPublication('poi-1', 'PUBLISHED', 'admin-1')).rejects.toMatchObject({
      code: 'DISCOVERY_PUBLICATION_INCOMPLETE',
      status: 409,
      details: { missing: ['description', 'photo'] },
    } satisfies Partial<PoiAcquisitionError>)
    expect(mockPoiUpdate).not.toHaveBeenCalled()
    expect(mockAuditCreate).not.toHaveBeenCalled()
  })

  it('unpublishes by clearing the date and recording the exact action', async () => {
    const published = {
      ...completePoi,
      discovery_status: 'PUBLISHED' as const,
      discovery_published_at: new Date('2026-08-20T15:00:00.000Z'),
    }
    mockPoiFindFirst.mockResolvedValue(published)
    mockPoiUpdate.mockImplementation(async ({ data }) => ({ ...published, ...data }))

    const result = await updatePoiDiscoveryPublication('poi-1', 'DRAFT', 'admin-1')

    expect(mockPoiUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: { discovery_status: 'DRAFT', discovery_published_at: null },
    }))
    expect(mockAuditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'poi_discovery_unpublished' }),
    })
    expect(result.discovery_published_at).toBeNull()
    expect(result.public_url).toBeNull()
  })

  it('maps a missing POI to the established not-found domain error', async () => {
    mockPoiFindFirst.mockResolvedValue(null)

    await expect(updatePoiDiscoveryPublication('missing', 'DRAFT', 'admin-1')).rejects.toMatchObject({
      code: 'POI_NOT_FOUND',
      status: 404,
    })
  })

  it.each([
    ['disable', disableAdminPoi, { ...completeAdminPoi, is_active: false, deleted_at: null }, 'poi_disabled'],
    ['archive', deleteAdminPoi, { ...completeAdminPoi, is_active: false, deleted_at: new Date('2026-08-20T16:00:00.000Z') }, 'poi_deleted'],
    ['restore', restoreAdminPoi, { ...completeAdminPoi, is_active: false, deleted_at: null }, 'poi_restored'],
  ])('automatically unpublishes in the same transaction on %s', async (
    _label,
    mutation,
    mutatedRow,
    mutationAction,
  ) => {
    const before = {
      ...completeAdminPoi,
      discovery_status: 'PUBLISHED' as const,
      discovery_published_at: new Date('2026-08-20T15:00:00.000Z'),
      deleted_at: _label === 'restore' ? new Date('2026-08-19T15:00:00.000Z') : null,
    }
    mockPoiFindFirst.mockResolvedValue(before)
    mockPoiUpdate
      .mockResolvedValueOnce({
        ...mutatedRow,
        discovery_status: 'PUBLISHED',
        discovery_published_at: before.discovery_published_at,
      })
      .mockResolvedValueOnce({
        ...mutatedRow,
        discovery_status: 'DRAFT',
        discovery_published_at: null,
      })

    const result = await mutation('poi-1', 'admin-1')

    expect(result.data.discovery_status).toBe('DRAFT')
    expect(result.data.discovery_published_at).toBeNull()
    expect(result.discovery_revalidation_paths).toEqual([
      '/decouvrir/saint-gervais',
      '/decouvrir/saint-gervais/manger',
      '/decouvrir/saint-gervais/manger/brasserie-du-mont-blanc',
    ])
    expect(mockAuditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: mutationAction }),
    })
    expect(mockAuditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'poi_discovery_auto_unpublished',
        before: expect.objectContaining({ discovery_status: 'PUBLISHED' }),
        after: expect.objectContaining({ discovery_status: 'DRAFT' }),
      }),
    })
  })

  it('automatically unpublishes an edited POI that loses BR-04 eligibility', async () => {
    const published = {
      ...completeAdminPoi,
      discovery_status: 'PUBLISHED' as const,
      discovery_published_at: new Date('2026-08-20T15:00:00.000Z'),
    }
    mockPoiFindFirst.mockResolvedValue(published)
    mockPoiUpdate
      .mockResolvedValueOnce({ ...published, description: null })
      .mockResolvedValueOnce({
        ...published,
        description: null,
        discovery_status: 'DRAFT',
        discovery_published_at: null,
      })

    const result = await updateAdminPoi('poi-1', { description: null }, 'admin-1')

    expect(result.data.discovery_status).toBe('DRAFT')
    expect(result.discovery_revalidation_paths).toEqual([
      '/decouvrir/saint-gervais',
      '/decouvrir/saint-gervais/manger',
      '/decouvrir/saint-gervais/manger/brasserie-du-mont-blanc',
    ])
    expect(mockAuditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'poi_updated' }),
    })
    expect(mockAuditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'poi_discovery_auto_unpublished' }),
    })
  })

  it('invalidates only the pre-mutation published route when category changes while becoming ineligible', async () => {
    const published = {
      ...completeAdminPoi,
      discovery_status: 'PUBLISHED' as const,
      discovery_published_at: new Date('2026-08-20T15:00:00.000Z'),
    }
    const movedAndIncomplete = {
      ...published,
      description: null,
      category_id: 'category-2',
      category: {
        ...published.category,
        id: 'category-2',
        name: 'Sortir',
        slug: 'sortir',
      },
    }
    mockPoiFindFirst.mockResolvedValue(published)
    mockCategoryFindFirst.mockResolvedValue({ id: 'category-2' })
    mockPoiUpdate
      .mockResolvedValueOnce(movedAndIncomplete)
      .mockResolvedValueOnce({
        ...movedAndIncomplete,
        discovery_status: 'DRAFT',
        discovery_published_at: null,
      })

    const result = await updateAdminPoi('poi-1', {
      category_id: 'category-2',
      description: null,
    }, 'admin-1')

    expect(mockPoiFindFirst).toHaveBeenCalledTimes(2)
    expect(mockPoiFindFirst.mock.invocationCallOrder[1]).toBeLessThan(
      mockPoiUpdate.mock.invocationCallOrder[0],
    )
    expect(result.discovery_revalidation_paths).toEqual([
      '/decouvrir/saint-gervais',
      '/decouvrir/saint-gervais/manger',
      '/decouvrir/saint-gervais/manger/brasserie-du-mont-blanc',
    ])
    expect(result.discovery_revalidation_paths).not.toContain('/decouvrir/saint-gervais/sortir')
    expect(result.discovery_revalidation_paths).not.toContain(
      '/decouvrir/saint-gervais/sortir/brasserie-du-mont-blanc',
    )
  })

  it('does not create a duplicate auto-unpublication audit for an already-DRAFT mutation', async () => {
    const draft = { ...completeAdminPoi, discovery_status: 'DRAFT' as const }
    mockPoiFindFirst.mockResolvedValue(draft)
    mockPoiUpdate.mockResolvedValue({ ...draft, is_active: false })

    const result = await disableAdminPoi('poi-1', 'admin-1')

    expect(mockAuditCreate).toHaveBeenCalledTimes(1)
    expect(mockAuditCreate).not.toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'poi_discovery_auto_unpublished' }),
    })
    expect(result.discovery_revalidation_paths).toEqual([])
  })

  it.each([
    ['PUBLISHED', '/decouvrir/saint-gervais/manger/brasserie-du-mont-blanc'],
    ['DRAFT', null],
  ] as const)('forms a safe Admin detail public URL for %s', async (status, publicUrl) => {
    mockPoiFindFirst.mockResolvedValue({
      ...completeAdminPoi,
      discovery_status: status,
      discovery_published_at: status === 'PUBLISHED'
        ? new Date('2026-08-20T15:00:00.000Z')
        : null,
    })

    const result = await getAdminPoi('poi-1')

    expect(result?.city).toEqual({ id: 'city-1', name: 'Saint-Gervais', slug: 'saint-gervais' })
    expect(result?.category).toEqual({ id: 'category-1', name: 'Manger', slug: 'manger' })
    expect(result?.subcategory).toBeNull()
    expect(result).not.toHaveProperty('city.is_active')
    expect(result).not.toHaveProperty('city.deleted_at')
    expect(result).not.toHaveProperty('category.is_active')
    expect(result).not.toHaveProperty('category.deleted_at')
    expect(result?.discovery_status).toBe(status)
    expect(result?.public_url).toBe(publicUrl)
    expect(result?.discovery_public_url).toBe(publicUrl)
  })

  it('maps list relation DTOs exactly without internal eligibility fields', async () => {
    mockPoiFindMany.mockResolvedValue([{
      ...completeAdminPoi,
      discovery_status: 'DRAFT',
      subcategory: {
        id: 'subcategory-1',
        name: 'Brasseries',
        slug: 'brasseries',
        is_active: true,
        deleted_at: null,
      },
    }])
    mockPoiCount
      .mockResolvedValueOnce(1)
      .mockResolvedValue(0)

    const result = await listAdminPois({ city_id: 'city-1', page: 1, limit: 25 })

    expect(result.data).toHaveLength(1)
    expect(result.data[0].city).toEqual({ id: 'city-1', name: 'Saint-Gervais', slug: 'saint-gervais' })
    expect(result.data[0].category).toEqual({ id: 'category-1', name: 'Manger', slug: 'manger' })
    expect(result.data[0].subcategory).toEqual({
      id: 'subcategory-1',
      name: 'Brasseries',
      slug: 'brasseries',
    })
    expect(result.data[0].city).not.toHaveProperty('is_active')
    expect(result.data[0].city).not.toHaveProperty('deleted_at')
    expect(result.data[0].category).not.toHaveProperty('is_active')
    expect(result.data[0].category).not.toHaveProperty('deleted_at')
    expect(result.data[0].subcategory).not.toHaveProperty('is_active')
    expect(result.data[0].subcategory).not.toHaveProperty('deleted_at')
  })
})
