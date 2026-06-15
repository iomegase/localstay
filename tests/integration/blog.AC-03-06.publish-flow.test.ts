const mockBlogArticleFindFirst = jest.fn()
const mockBlogArticleUpdate = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    blogArticle: {
      findFirst: (...args: unknown[]) => mockBlogArticleFindFirst(...args),
      update: (...args: unknown[]) => mockBlogArticleUpdate(...args),
    },
  },
}))

import { publishBlogArticle } from '@/features/blog/queries/admin-blog'

describe('029 blog publish flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('publishes a complete draft and sets published_at', async () => {
    mockBlogArticleFindFirst.mockResolvedValue({
      id: 'article-1',
      slug: 'week-end-saint-gervais',
      title: 'Un week-end à Saint-Gervais',
      excerpt:
        'Un guide éditorial complet pour préparer un séjour alpin avec des idées locales, des conseils fiables et un rythme clair.',
      content_markdown: 'a'.repeat(320),
      seo_title: 'Week-end à Saint-Gervais — Guide local MyStay',
      seo_description:
        'Préparez un week-end à Saint-Gervais avec un angle éditorial local, des repères utiles et un parcours clair.',
      city: null,
      photos: [{ alt: 'Vue sur Saint-Gervais' }],
    })
    mockBlogArticleUpdate.mockResolvedValue({
      id: 'article-1',
      status: 'published',
      slug: 'week-end-saint-gervais',
    })

    const article = await publishBlogArticle('article-1')

    expect(mockBlogArticleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'article-1' },
        data: expect.objectContaining({
          status: 'published',
          published_at: expect.any(Date),
          archived_at: null,
        }),
      }),
    )
    expect(article).toEqual({
      id: 'article-1',
      status: 'published',
      slug: 'week-end-saint-gervais',
    })
  })
})
