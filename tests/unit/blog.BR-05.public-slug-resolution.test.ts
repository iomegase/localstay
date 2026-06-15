const mockBlogArticleFindMany = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    blogArticle: {
      findMany: (...args: unknown[]) => mockBlogArticleFindMany(...args),
    },
  },
}))

import { getPublishedBlogArticleBySlug } from '@/features/blog/queries/public-blog'

describe('029 blog public slug resolution', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('resolves a published article from an encoded legacy slug containing spaces', async () => {
    mockBlogArticleFindMany.mockResolvedValue([
      {
        id: 'article-1',
        slug: 'vivre a saint nicolas',
        title: 'Vivre à Saint-Nicolas',
        excerpt:
          'Un article éditorial complet pour préparer un séjour local avec des repères utiles, des conseils pratiques et une lecture claire.',
        content_markdown: 'a'.repeat(320),
        category: 'local_guide',
        tags: ['saint-nicolas'],
        published_at: new Date('2026-06-15T10:00:00Z'),
        seo_title: 'Vivre à Saint-Nicolas | MyStay',
        seo_description:
          'Préparez votre séjour à Saint-Nicolas avec un angle éditorial local, des repères utiles et un parcours clair.',
        city: { name: 'Saint-Nicolas-de-Véroce', slug: 'saint-nicolas-de-veroce' },
        photos: [
          { id: 'cover-1', kind: 'cover', url: 'https://img.test/cover.jpg', alt: 'Vue', sort_order: 0 },
        ],
      },
    ])

    const article = await getPublishedBlogArticleBySlug('vivre%20a%20saint%20nicolas')

    expect(mockBlogArticleFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { slug: 'vivre%20a%20saint%20nicolas' },
            { slug: 'vivre a saint nicolas' },
            { slug: 'vivre-a-saint-nicolas' },
          ]),
        }),
      }),
    )
    expect(article?.slug).toBe('vivre a saint nicolas')
  })
})
