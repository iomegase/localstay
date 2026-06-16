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

    const result = await generateBlogDraftWithGemini({
      brief: 'Rédige un article de 100 mots sur Saint-Nicolas-de-Véroce.',
      verifiedFacts: 'Le village est rattaché à Saint-Gervais et le guide MyStay référence déjà des activités locales.',
      cityContext: { name: 'Saint-Nicolas-de-Véroce', slug: 'saint-nicolas-de-veroce' },
    })

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.stringContaining("Le corps de l'article en Markdown doit viser environ 100 mots."),
    )
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.stringContaining('Respecte strictement ces longueurs: title 5-90 caractères, excerpt 40-220 caractères, seo_title 30-70 caractères, seo_description 80-180 caractères.'),
    )
    expect(result.draft).toMatchObject({
      title: 'Saint-Nicolas-de-Veroce en 100 mots',
    })
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

  it('returns deduplicated grounded sources and enables googleSearch', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            title: 'Saint-Gervais en 150 mots',
            excerpt:
              'Une synthese editoriale locale construite a partir du brief admin et de sources grounded.',
            content_markdown: 'mot '.repeat(150).trim(),
            seo_title: 'Saint-Gervais en 150 mots | MyStay',
            seo_description:
              'Une version grounded de Saint-Gervais avec sources de generation et angle editorial local.',
          }),
        candidates: [
          {
            groundingMetadata: {
              groundingChunks: [
                { web: { uri: 'https://www.saintgervais.com/article', title: 'Office de tourisme' } },
                { web: { uri: 'https://www.saintgervais.com/article', title: 'Office de tourisme (dup)' } },
                { web: { uri: 'https://www.mystay.example/blog-facts', title: 'Faits verifies MyStay' } },
              ],
            },
          },
        ],
      },
    })

    const result = await generateBlogDraftWithGemini({
      brief: 'Rédige un article de 150 mots sur Saint-Gervais.',
      verifiedFacts:
        'Les thermes, les restaurants verifies et les sentiers publics sont deja valides dans MyStay.',
      cityContext: { name: 'Saint-Gervais', slug: 'saint-gervais' },
    })

    expect(mockGetGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-test-model',
        tools: [expect.objectContaining({ googleSearch: {} })],
      }),
    )

    expect(result).toMatchObject({
      draft: {
        title: 'Saint-Gervais en 150 mots',
        seo_title: 'Saint-Gervais en 150 mots | MyStay',
      },
      sources: [
        { title: 'Office de tourisme', url: 'https://www.saintgervais.com/article' },
        { title: 'Faits verifies MyStay', url: 'https://www.mystay.example/blog-facts' },
      ],
    })
  })
})
