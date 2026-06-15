const mockBlogGenerationDraftFindFirst = jest.fn()
const mockBlogGenerationDraftUpdate = jest.fn()
const mockBlogArticleUpdate = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    blogGenerationDraft: {
      findFirst: (...args: unknown[]) => mockBlogGenerationDraftFindFirst(...args),
      update: (...args: unknown[]) => mockBlogGenerationDraftUpdate(...args),
    },
    blogArticle: {
      update: (...args: unknown[]) => mockBlogArticleUpdate(...args),
    },
  },
}))

import { applyBlogGeneration } from '@/features/blog/queries/admin-blog'

describe('029 blog generation application', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('applies the accepted Gemini suggestion while keeping the article in draft workflow', async () => {
    mockBlogGenerationDraftFindFirst.mockResolvedValue({
      id: 'generation-1',
      suggestion_title: 'Week-end à Saint-Gervais',
      suggestion_excerpt: 'Une proposition éditoriale pour préparer un séjour avec des repères utiles et fiables.',
      suggestion_markdown: 'a'.repeat(320),
      suggestion_seo_title: 'Week-end à Saint-Gervais — Guide local MyStay',
      suggestion_seo_description:
        'Préparez un week-end à Saint-Gervais avec un angle éditorial local, des repères utiles et un parcours clair.',
    })
    mockBlogGenerationDraftUpdate.mockResolvedValue({})
    mockBlogArticleUpdate.mockResolvedValue({
      id: 'article-1',
      title: 'Week-end à Saint-Gervais',
      slug: 'week-end-saint-gervais',
      status: 'draft',
      category: 'local_guide',
      published_at: null,
      updated_at: new Date('2026-06-15T12:00:00Z'),
      city: { name: 'Saint-Gervais-les-Bains' },
      excerpt: 'Une proposition éditoriale pour préparer un séjour avec des repères utiles et fiables.',
      content_markdown: 'a'.repeat(320),
      tags: ['sejour'],
      seo_title: 'Week-end à Saint-Gervais — Guide local MyStay',
      seo_description:
        'Préparez un week-end à Saint-Gervais avec un angle éditorial local, des repères utiles et un parcours clair.',
      photos: [],
    })

    const result = await applyBlogGeneration('article-1', 'generation-1')

    expect(mockBlogGenerationDraftUpdate).toHaveBeenCalledWith({
      where: { id: 'generation-1' },
      data: { status: 'accepted' },
    })
    expect(mockBlogArticleUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'article-1' },
        data: expect.objectContaining({
          title: 'Week-end à Saint-Gervais',
          excerpt: 'Une proposition éditoriale pour préparer un séjour avec des repères utiles et fiables.',
          content_markdown: 'a'.repeat(320),
          seo_title: 'Week-end à Saint-Gervais — Guide local MyStay',
        }),
      }),
    )
    expect(result).toMatchObject({
      id: 'article-1',
      status: 'draft',
      title: 'Week-end à Saint-Gervais',
    })
  })
})
