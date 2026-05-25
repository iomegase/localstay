const mockPoiCount = jest.fn()
const mockGeminiCacheCount = jest.fn()
const mockCacheTtlCount = jest.fn()
const mockCustomizationCount = jest.fn()
const mockAnalyticsCount = jest.fn()
const mockCategoryFindMany = jest.fn()
const mockPoiGroupBy = jest.fn()
const mockGeminiGroupBy = jest.fn()
const mockCacheFindMany = jest.fn()
const mockCustomizationFindMany = jest.fn()
const mockAnalyticsGroupBy = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    category: { findMany: (...args: unknown[]) => mockCategoryFindMany(...args) },
    pointOfInterest: {
      count: (...args: unknown[]) => mockPoiCount(...args),
      groupBy: (...args: unknown[]) => mockPoiGroupBy(...args),
    },
    geminiCache: {
      count: (...args: unknown[]) => mockGeminiCacheCount(...args),
      groupBy: (...args: unknown[]) => mockGeminiGroupBy(...args),
    },
    cacheTtlConfig: {
      count: (...args: unknown[]) => mockCacheTtlCount(...args),
      findMany: (...args: unknown[]) => mockCacheFindMany(...args),
    },
    lodgingCustomization: {
      count: (...args: unknown[]) => mockCustomizationCount(...args),
      findMany: (...args: unknown[]) => mockCustomizationFindMany(...args),
    },
    analytics: {
      count: (...args: unknown[]) => mockAnalyticsCount(...args),
      groupBy: (...args: unknown[]) => mockAnalyticsGroupBy(...args),
    },
  },
}))

import { getAdminTaxonomy, getCategorySlugLock, getSubCategorySlugLock } from '@/features/admin-taxonomy/queries/taxonomy'

describe('017 admin taxonomy slug locking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPoiCount.mockResolvedValue(0)
    mockGeminiCacheCount.mockResolvedValue(0)
    mockCacheTtlCount.mockResolvedValue(0)
    mockCustomizationCount.mockResolvedValue(0)
    mockAnalyticsCount.mockResolvedValue(0)
    mockCategoryFindMany.mockResolvedValue([])
    mockPoiGroupBy.mockResolvedValue([])
    mockGeminiGroupBy.mockResolvedValue([])
    mockCacheFindMany.mockResolvedValue([])
    mockCustomizationFindMany.mockResolvedValue([])
    mockAnalyticsGroupBy.mockResolvedValue([])
  })

  it('AC-03-02/BR-06: locks a Category slug when active POIs or active dependencies exist', async () => {
    mockPoiCount.mockResolvedValueOnce(1)

    await expect(getCategorySlugLock({ id: 'cat-1', slug: 'restaurants' })).resolves.toBe(true)

    expect(mockPoiCount).toHaveBeenCalledWith({
      where: { category_id: 'cat-1', is_active: true, deleted_at: null },
    })
  })

  it('AC-03-03: keeps a Category slug editable when there are no active dependencies', async () => {
    await expect(getCategorySlugLock({ id: 'cat-1', slug: 'nouveau' })).resolves.toBe(false)
  })

  it('AC-04-03: locks a SubCategory slug when active POIs use it', async () => {
    mockPoiCount.mockResolvedValueOnce(1)

    await expect(getSubCategorySlugLock('sub-1')).resolves.toBe(true)

    expect(mockPoiCount).toHaveBeenCalledWith({
      where: { subcategory_id: 'sub-1', is_active: true, deleted_at: null },
    })
  })

  it('AC-01-01: computes taxonomy slug locks with batched queries instead of per-row counts', async () => {
    mockCategoryFindMany.mockResolvedValue([
      {
        id: 'cat-1',
        name: 'Dîner',
        slug: 'diner',
        icon: 'utensils',
        sort_order: 1,
        is_active: true,
        _count: { pois: 1 },
        subcategories: [
          {
            id: 'sub-1',
            category_id: 'cat-1',
            name: 'Restaurants',
            slug: 'restaurants',
            sort_order: 1,
            is_active: true,
            _count: { pois: 1 },
          },
        ],
      },
    ])
    mockPoiGroupBy
      .mockResolvedValueOnce([{ category_id: 'cat-1', _count: { _all: 1 } }])
      .mockResolvedValueOnce([{ subcategory_id: 'sub-1', _count: { _all: 1 } }])

    await expect(getAdminTaxonomy()).resolves.toEqual([
      expect.objectContaining({
        slug_locked: true,
        subcategories: [expect.objectContaining({ slug_locked: true })],
      }),
    ])

    expect(mockPoiCount).not.toHaveBeenCalled()
    expect(mockGeminiCacheCount).not.toHaveBeenCalled()
    expect(mockCacheTtlCount).not.toHaveBeenCalled()
    expect(mockCustomizationCount).not.toHaveBeenCalled()
    expect(mockAnalyticsCount).not.toHaveBeenCalled()
  })
})
