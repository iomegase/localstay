const mockFindMany = jest.fn()
const mockCity = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: { findFirst: (...args: unknown[]) => mockCity(...args) },
    blogArticle: { findMany: (...args: unknown[]) => mockFindMany(...args) },
  },
}))

import { getPublishedBlogArticles } from '@/features/blog/queries/public-blog'

describe('054 AC-01-16 private guide Journal category', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCity.mockResolvedValue({ id: 'city-1', name: 'Saint-Gervais', slug: 'saint-gervais' })
    mockFindMany.mockResolvedValue([])
  })

  it('combines local guide category with city and publication constraints, preserving the empty state', async () => {
    const result = await getPublishedBlogArticles('saint-gervais', 'local_guide')
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        status: 'published', deleted_at: null, NOT: { published_at: null },
        city_id: 'city-1', category: 'local_guide',
      },
      orderBy: { published_at: 'desc' },
    }))
    expect(result?.items).toEqual([])
  })

  it('keeps public city lists unrestricted by category', async () => {
    await getPublishedBlogArticles('saint-gervais')
    const { where } = mockFindMany.mock.calls[0][0]
    expect(where).not.toHaveProperty('category')
    expect(where.city_id).toBe('city-1')
  })
})
