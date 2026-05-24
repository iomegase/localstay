const mockPoiCount = jest.fn()
const mockGeminiCacheCount = jest.fn()
const mockCacheTtlCount = jest.fn()
const mockCustomizationCount = jest.fn()
const mockAnalyticsCount = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: { count: (...args: unknown[]) => mockPoiCount(...args) },
    geminiCache: { count: (...args: unknown[]) => mockGeminiCacheCount(...args) },
    cacheTtlConfig: { count: (...args: unknown[]) => mockCacheTtlCount(...args) },
    lodgingCustomization: { count: (...args: unknown[]) => mockCustomizationCount(...args) },
    analytics: { count: (...args: unknown[]) => mockAnalyticsCount(...args) },
  },
}))

import { getCategorySlugLock, getSubCategorySlugLock } from '@/features/admin-taxonomy/queries/taxonomy'

describe('017 admin taxonomy slug locking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPoiCount.mockResolvedValue(0)
    mockGeminiCacheCount.mockResolvedValue(0)
    mockCacheTtlCount.mockResolvedValue(0)
    mockCustomizationCount.mockResolvedValue(0)
    mockAnalyticsCount.mockResolvedValue(0)
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
})
