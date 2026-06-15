const mockBlogArticleUpdate = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    blogArticle: {
      update: (...args: unknown[]) => mockBlogArticleUpdate(...args),
    },
  },
}))

import { archiveBlogArticle } from '@/features/blog/queries/admin-blog'

describe('029 blog archive flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('archives a published article and records archived_at', async () => {
    mockBlogArticleUpdate.mockResolvedValue({
      id: 'article-1',
      status: 'archived',
      slug: 'week-end-saint-gervais',
    })

    const article = await archiveBlogArticle('article-1')

    expect(mockBlogArticleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'article-1' },
        data: expect.objectContaining({
          status: 'archived',
          archived_at: expect.any(Date),
        }),
      }),
    )
    expect(article).toEqual({
      id: 'article-1',
      status: 'archived',
      slug: 'week-end-saint-gervais',
    })
  })
})
