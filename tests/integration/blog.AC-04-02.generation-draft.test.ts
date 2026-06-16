import { ZodError } from 'zod'

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

import { ApiBlogError, generateBlogDraft } from '@/features/blog/queries/admin-blog'

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
      draft: {
        title: 'Week-end à Saint-Gervais',
        excerpt: 'Une proposition éditoriale pour préparer un séjour avec des repères utiles et fiables.',
        content_markdown: 'a'.repeat(320),
        seo_title: 'Week-end à Saint-Gervais — Guide local MyStay',
        seo_description:
          'Préparez un week-end à Saint-Gervais avec un angle éditorial local, des repères utiles et un parcours clair.',
      },
      sources: [
        { title: 'Office de tourisme', url: 'https://www.saintgervais.com/article' },
      ],
    })
    mockBlogGenerationDraftCreate.mockResolvedValue({
      id: 'generation-1',
      status: 'generated',
      provider: 'gemini',
      suggestion_title: 'Week-end à Saint-Gervais',
      suggestion_excerpt: 'Une proposition éditoriale pour préparer un séjour avec des repères utiles et fiables.',
      suggestion_markdown: 'a'.repeat(320),
      suggestion_seo_title: 'Week-end à Saint-Gervais — Guide local MyStay',
      suggestion_seo_description:
        'Préparez un week-end à Saint-Gervais avec un angle éditorial local, des repères utiles et un parcours clair.',
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
      text: 'a'.repeat(320),
      sources: [{ title: 'Office de tourisme', url: 'https://www.saintgervais.com/article' }],
    })
  })

  it('maps an invalid Gemini payload to a structured API error', async () => {
    mockBlogArticleFindFirst.mockResolvedValue({
      id: 'article-1',
      city: { name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' },
    })
    mockGenerateBlogDraftWithGemini.mockRejectedValue(
      new ZodError([
        {
          code: 'too_big',
          maximum: 70,
          type: 'string',
          inclusive: true,
          exact: false,
          message: 'Le SEO title doit contenir entre 30 et 70 caractères.',
          path: ['seo_title'],
        },
      ]),
    )

    await expect(
      generateBlogDraft(
        'article-1',
        {
          brief: 'Rédige un article chaleureux et utile pour organiser un week-end à Saint-Gervais.',
          verified_facts:
            'Les thermes, le centre du village et les sentiers publiés dans le guide sont des faits déjà validés.',
        },
        'admin-1',
      ),
    ).rejects.toMatchObject<ApiBlogError>({
      code: 'GEMINI_INVALID_RESPONSE',
      message: 'La proposition Gemini reçue est invalide.',
      status: 502,
      details: {
        fieldErrors: {
          seo_title: ['Le SEO title doit contenir entre 30 et 70 caractères.'],
        },
      },
    })

    expect(mockBlogGenerationDraftCreate).not.toHaveBeenCalled()
    expect(mockBlogArticleUpdate).not.toHaveBeenCalled()
  })
})
