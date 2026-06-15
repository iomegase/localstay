const mockBlogArticleFindFirst = jest.fn()
const mockBlogArticleUpdate = jest.fn()
const mockBlogGenerationDraftCreate = jest.fn()
const mockGenerateBlogDraftWithGemini = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    blogArticle: {
      findFirst: (...args: unknown[]) => mockBlogArticleFindFirst(...args),
      update: (...args: unknown[]) => mockBlogArticleUpdate(...args),
    },
    blogGenerationDraft: {
      create: (...args: unknown[]) => mockBlogGenerationDraftCreate(...args),
    },
  },
}))

jest.mock('@/features/blog/services/gemini-draft', () => ({
  generateBlogDraftWithGemini: (...args: unknown[]) => mockGenerateBlogDraftWithGemini(...args),
}))

import { generateBlogDraft } from '@/features/blog/queries/admin-blog'

describe('029 blog generation draft persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('stores the generated Gemini suggestion as a draft without updating the article', async () => {
    mockBlogArticleFindFirst.mockResolvedValue({
      id: 'article-1',
      city: { name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' },
    })
    mockGenerateBlogDraftWithGemini.mockResolvedValue({
      title: 'Week-end à Saint-Gervais',
      excerpt: 'Une proposition éditoriale pour préparer un séjour avec des repères utiles et fiables.',
      content_markdown: 'a'.repeat(320),
      seo_title: 'Week-end à Saint-Gervais — Guide local MyStay',
      seo_description:
        'Préparez un week-end à Saint-Gervais avec un angle éditorial local, des repères utiles et un parcours clair.',
    })
    mockBlogGenerationDraftCreate.mockResolvedValue({
      id: 'generation-1',
      status: 'generated',
      provider: 'gemini',
      suggestion_title: 'Week-end à Saint-Gervais',
    })

    const result = await generateBlogDraft(
      'article-1',
      {
        brief: 'Rédige un article chaleureux et utile pour organiser un week-end à Saint-Gervais.',
        verified_facts:
          'Les thermes, le centre du village et les sentiers publiés dans le guide sont des faits déjà validés.',
      },
      'admin-1',
    )

    expect(mockBlogGenerationDraftCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          article_id: 'article-1',
          admin_id: 'admin-1',
          status: 'generated',
          suggestion_title: 'Week-end à Saint-Gervais',
        }),
      }),
    )
    expect(mockBlogArticleUpdate).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      id: 'generation-1',
      status: 'generated',
      provider: 'gemini',
    })
  })
})
