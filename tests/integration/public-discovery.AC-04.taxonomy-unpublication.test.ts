const mockTransaction = jest.fn()
const mockCategoryFindFirst = jest.fn()
const mockCategoryUpdate = jest.fn()
const mockSubCategoryFindFirst = jest.fn()
const mockSubCategoryUpdate = jest.fn()
const mockPoiFindMany = jest.fn()
const mockPoiUpdate = jest.fn()
const mockPoiCount = jest.fn()
const mockPoiGroupBy = jest.fn()
const mockTaxonomyAuditCreate = jest.fn()
const mockPoiAuditCreate = jest.fn()
const mockGeminiGroupBy = jest.fn()
const mockCacheFindMany = jest.fn()
const mockCustomizationFindMany = jest.fn()
const mockAnalyticsGroupBy = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    $transaction: (...args: unknown[]) => mockTransaction(...args),
    category: { findFirst: (...args: unknown[]) => mockCategoryFindFirst(...args) },
    subCategory: { findFirst: (...args: unknown[]) => mockSubCategoryFindFirst(...args) },
    pointOfInterest: {
      count: (...args: unknown[]) => mockPoiCount(...args),
      groupBy: (...args: unknown[]) => mockPoiGroupBy(...args),
    },
    geminiCache: { groupBy: (...args: unknown[]) => mockGeminiGroupBy(...args) },
    cacheTtlConfig: { findMany: (...args: unknown[]) => mockCacheFindMany(...args) },
    lodgingCustomization: { findMany: (...args: unknown[]) => mockCustomizationFindMany(...args) },
    analytics: { groupBy: (...args: unknown[]) => mockAnalyticsGroupBy(...args) },
  },
}))

import { updateCategory, updateSubCategory } from '@/features/admin-taxonomy/queries/taxonomy'

const category = {
  id: 'cat-1',
  name: 'Dîner',
  slug: 'diner',
  icon: 'utensils',
  sort_order: 1,
  is_active: true,
}

const publishedPois = [
  {
    id: 'poi-1',
    slug: 'la-table',
    discovery_status: 'PUBLISHED',
    discovery_published_at: new Date('2026-08-20T15:00:00.000Z'),
    city: { slug: 'saint-gervais' },
    category: { slug: 'diner' },
  },
  {
    id: 'poi-2',
    slug: 'le-bistrot',
    discovery_status: 'PUBLISHED',
    discovery_published_at: new Date('2026-08-20T15:30:00.000Z'),
    city: { slug: 'saint-gervais' },
    category: { slug: 'diner' },
  },
]

describe('041 dependency deactivation publication cascade', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCategoryFindFirst
      .mockResolvedValueOnce(category)
      .mockResolvedValue({
        ...category,
        is_active: false,
        _count: { pois: 2 },
        subcategories: [],
      })
    mockSubCategoryFindFirst.mockResolvedValue({
      id: 'sub-1',
      category_id: 'cat-1',
      name: 'Restaurants',
      slug: 'restaurants',
      sort_order: 1,
      is_active: true,
    })
    mockCategoryUpdate.mockResolvedValue({ ...category, is_active: false })
    mockSubCategoryUpdate.mockResolvedValue({
      id: 'sub-1',
      category_id: 'cat-1',
      name: 'Restaurants',
      slug: 'restaurants',
      sort_order: 1,
      is_active: false,
    })
    mockPoiFindMany.mockResolvedValue(publishedPois)
    mockPoiUpdate.mockResolvedValue({ discovery_status: 'DRAFT', discovery_published_at: null })
    mockPoiCount.mockResolvedValue(0)
    mockPoiGroupBy.mockResolvedValue([])
    mockGeminiGroupBy.mockResolvedValue([])
    mockCacheFindMany.mockResolvedValue([])
    mockCustomizationFindMany.mockResolvedValue([])
    mockAnalyticsGroupBy.mockResolvedValue([])
    mockTransaction.mockImplementation(async callback => callback({
      category: { update: mockCategoryUpdate },
      subCategory: { update: mockSubCategoryUpdate },
      pointOfInterest: { findMany: mockPoiFindMany, update: mockPoiUpdate },
      taxonomyChangeLog: { create: mockTaxonomyAuditCreate },
      poiAcquisitionAuditLog: { create: mockPoiAuditCreate },
    }))
  })

  it('atomically drafts and audits every published POI when a Category is disabled', async () => {
    const result = await updateCategory('cat-1', { is_active: false }, 'admin-1')

    expect(mockTransaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' })
    expect(mockPoiUpdate).toHaveBeenCalledTimes(2)
    expect(mockPoiAuditCreate).toHaveBeenCalledTimes(2)
    expect(mockPoiAuditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'poi_discovery_auto_unpublished',
        before: expect.objectContaining({
          discovery_status: 'PUBLISHED',
          cause: { type: 'category', id: 'cat-1', reason: 'inactive' },
        }),
        after: expect.objectContaining({ discovery_status: 'DRAFT' }),
      }),
    })
    expect(result.discovery_revalidation_paths).toEqual([
      '/decouvrir/saint-gervais',
      '/decouvrir/saint-gervais/diner',
      '/decouvrir/saint-gervais/diner/la-table',
      '/decouvrir/saint-gervais/diner/le-bistrot',
    ])
  })

  it('drafts SubCategory POIs with one audit each in the taxonomy transaction', async () => {
    const result = await updateSubCategory('sub-1', { is_active: false }, 'admin-1')

    expect(mockPoiFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { subcategory_id: 'sub-1', discovery_status: 'PUBLISHED' },
    }))
    expect(mockPoiAuditCreate).toHaveBeenCalledTimes(2)
    expect(mockPoiAuditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        before: expect.objectContaining({
          cause: { type: 'subcategory', id: 'sub-1', reason: 'inactive' },
        }),
      }),
    })
    expect(result.discovery_revalidation_paths).toHaveLength(4)
  })

  it('never republishes POIs when a dependency is reactivated', async () => {
    mockCategoryFindFirst.mockReset()
    mockCategoryFindFirst
      .mockResolvedValueOnce({ ...category, is_active: false })
      .mockResolvedValue({ ...category, _count: { pois: 0 }, subcategories: [] })
    mockCategoryUpdate.mockResolvedValue(category)

    const result = await updateCategory('cat-1', { is_active: true }, 'admin-1')

    expect(mockPoiFindMany).not.toHaveBeenCalled()
    expect(mockPoiUpdate).not.toHaveBeenCalled()
    expect(mockPoiAuditCreate).not.toHaveBeenCalled()
    expect(result.discovery_revalidation_paths).toEqual([])
  })

  it('rejects the whole composed mutation when a POI audit fails', async () => {
    const failure = new Error('audit unavailable')
    mockPoiAuditCreate.mockRejectedValueOnce(failure)

    await expect(updateCategory('cat-1', { is_active: false }, 'admin-1')).rejects.toBe(failure)
    expect(mockPoiUpdate).toHaveBeenCalledTimes(1)
  })
})
