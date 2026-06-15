const mockGenerateContent = jest.fn()
const mockGetGenerativeModel = jest.fn(() => ({
  generateContent: mockGenerateContent,
}))

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}))

import { generateBlogDraftWithGemini } from '@/features/blog/services/gemini-draft'

describe('029 blog gemini draft service', () => {
  const previousApiKey = process.env.GEMINI_API_KEY
  const previousModel = process.env.GEMINI_MODEL

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GEMINI_API_KEY = 'test-key'
    process.env.GEMINI_MODEL = 'gemini-test-model'
  })

  afterAll(() => {
    process.env.GEMINI_API_KEY = previousApiKey
    process.env.GEMINI_MODEL = previousModel
  })

  it('injects the requested word count into the Gemini prompt', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            title: 'Saint-Nicolas-de-Veroce en 100 mots',
            excerpt:
              'Un angle editorial concis et factuel pour raconter la station sans sortir des faits verifies fournis.',
            content_markdown: 'mot '.repeat(100).trim(),
            seo_title: 'Saint-Nicolas-de-Veroce en 100 mots | MyStay',
            seo_description:
              'Une version courte, factuelle et encadree de Saint-Nicolas-de-Veroce, redigee a partir de faits verifies.',
          }),
      },
    })

    await generateBlogDraftWithGemini({
      brief: 'Rédige un article de 100 mots sur Saint-Nicolas-de-Véroce.',
      verifiedFacts: 'Le village est rattaché à Saint-Gervais et le guide MyStay référence déjà des activités locales.',
      cityContext: { name: 'Saint-Nicolas-de-Véroce', slug: 'saint-nicolas-de-veroce' },
    })

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.stringContaining("Le corps de l'article en Markdown doit viser environ 100 mots."),
    )
  })

  it('rejects a Gemini draft when the markdown is far shorter than the requested length', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            title: 'Saint-Nicolas-de-Veroce en 400 mots',
            excerpt:
              'Un angle editorial concis et factuel pour raconter la station sans sortir des faits verifies fournis.',
            content_markdown: 'motlong '.repeat(60).trim(),
            seo_title: 'Saint-Nicolas-de-Veroce en 400 mots | MyStay',
            seo_description:
              'Une version plus longue et structuree de Saint-Nicolas-de-Veroce, redigee a partir de faits verifies.',
          }),
      },
    })

    await expect(
      generateBlogDraftWithGemini({
        brief: 'Rédige un article de 400 mots sur Saint-Nicolas-de-Véroce.',
        verifiedFacts: 'Le village est rattaché à Saint-Gervais et le guide MyStay référence déjà des activités locales.',
        cityContext: { name: 'Saint-Nicolas-de-Véroce', slug: 'saint-nicolas-de-veroce' },
      }),
    ).rejects.toMatchObject({
      issues: [
        expect.objectContaining({
          path: ['content_markdown'],
          message: expect.stringContaining('400 mots'),
        }),
      ],
    })
  })
})
