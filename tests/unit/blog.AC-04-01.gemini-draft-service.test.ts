const mockGenerateContent = jest.fn()
const mockGetGenerativeModel = jest.fn(() => ({
  generateContent: mockGenerateContent,
}))

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
  SchemaType: {
    OBJECT: 'object',
    STRING: 'string',
  },
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
        generationConfig: expect.objectContaining({
          responseMimeType: 'application/json',
          responseSchema: expect.objectContaining({
            type: 'object',
            required: ['title', 'excerpt', 'content_markdown', 'seo_title', 'seo_description'],
          }),
        }),
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

  it('normalizes missing derived editorial fields before validating the Gemini draft', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            title: 'Vivre en Haute-Savoie en 1900',
            content_markdown: [
              'Vivre en Haute-Savoie en 1900 signifiait composer chaque jour avec un climat rude, des deplacements lents et une economie locale tres contrainte.',
              'Dans les vallees comme sur les hauteurs, les familles organisaient le travail, les ressources et les solidarites autour du rythme des saisons.',
              'Cet equilibre fragile explique a la fois la durete du quotidien et l impression de tenacite qui marque encore les recits de cette epoque.',
            ].join('\n\n'),
          }),
      },
    })

    const result = await generateBlogDraftWithGemini({
      brief: 'Rédige un article éditorial sur la vie en Haute-Savoie autour de 1900.',
      verifiedFacts: '',
      cityContext: null,
    })

    expect(result.draft.title).toBe('Vivre en Haute-Savoie en 1900')
    expect(result.draft.excerpt.length).toBeGreaterThanOrEqual(40)
    expect(result.draft.excerpt.length).toBeLessThanOrEqual(220)
    expect(result.draft.seo_title.length).toBeGreaterThanOrEqual(30)
    expect(result.draft.seo_title.length).toBeLessThanOrEqual(70)
    expect(result.draft.seo_description.length).toBeGreaterThanOrEqual(80)
    expect(result.draft.seo_description.length).toBeLessThanOrEqual(180)
  })

  it('extracts the first JSON object when Gemini wraps the payload in prose', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => [
          'Voici le brouillon demandé.',
          '',
          '{',
          '  "title": "Vivre en Haute-Savoie en 1900",',
          '  "excerpt": "Une proposition editoriale ancree dans le quotidien, les contraintes et les solidarites locales de la Haute-Savoie vers 1900.",',
          '  "content_markdown": "' + 'mot '.repeat(90).trim() + '",',
          '  "seo_title": "Vivre en Haute-Savoie en 1900 | Blog MyStay",',
          '  "seo_description": "Une lecture editoriale de la Haute-Savoie vers 1900, entre climat rude, vie locale contrainte et adaptation quotidienne."',
          '}',
          '',
          'Relis et adapte si besoin.',
        ].join('\n'),
      },
    })

    const result = await generateBlogDraftWithGemini({
      brief: 'Rédige un article éditorial sur la vie en Haute-Savoie autour de 1900.',
      verifiedFacts: '',
      cityContext: null,
    })

    expect(result.draft.title).toBe('Vivre en Haute-Savoie en 1900')
    expect(result.draft.seo_title).toBe('Vivre en Haute-Savoie en 1900 | Blog MyStay')
  })

  it('defaults to gemini-3.5-flash when no explicit Gemini model is configured', async () => {
    delete process.env.GEMINI_MODEL
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            title: 'Week-end à Saint-Gervais',
            excerpt:
              'Une proposition editoriale locale pour organiser un week-end utile et lisible autour de Saint-Gervais.',
            content_markdown: 'mot '.repeat(90).trim(),
            seo_title: 'Week-end à Saint-Gervais | Blog MyStay',
            seo_description:
              'Une proposition editoriale locale pour Saint-Gervais, avec angle clair, sources grounded et lecture utile.',
          }),
      },
    })

    await generateBlogDraftWithGemini({
      brief: 'Rédige un article sur un week-end à Saint-Gervais.',
      verifiedFacts: '',
      cityContext: { name: 'Saint-Gervais', slug: 'saint-gervais' },
    })

    expect(mockGetGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-3.5-flash',
      }),
    )
  })

  it('translates a non-readable Gemini response into a syntax-level invalid response error', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => {
          throw new Error('Candidate was blocked due to SAFETY')
        },
      },
    })

    await expect(
      generateBlogDraftWithGemini({
        brief: 'Rédige un article sur un week-end à Saint-Gervais.',
        verifiedFacts: '',
        cityContext: { name: 'Saint-Gervais', slug: 'saint-gervais' },
      }),
    ).rejects.toBeInstanceOf(SyntaxError)
  })

  it('retries without structured output when the grounded model rejects responseMimeType json', async () => {
    mockGenerateContent
      .mockRejectedValueOnce(
        new Error("[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent: [400 Bad Request] Tool use with a response mime type: 'application/json' is unsupported"),
      )
      .mockResolvedValueOnce({
        response: {
          text: () =>
            JSON.stringify({
              title: 'Week-end à Saint-Gervais',
              excerpt:
                'Une proposition editoriale locale pour organiser un week-end utile et lisible autour de Saint-Gervais.',
              content_markdown: 'mot '.repeat(90).trim(),
              seo_title: 'Week-end à Saint-Gervais | Blog MyStay',
              seo_description:
                'Une proposition editoriale locale pour Saint-Gervais, avec angle clair, sources grounded et lecture utile.',
            }),
          candidates: [
            {
              groundingMetadata: {
                groundingChunks: [
                  { web: { uri: 'https://www.saintgervais.com/article', title: 'Office de tourisme' } },
                ],
              },
            },
          ],
        },
      })

    const result = await generateBlogDraftWithGemini({
      brief: 'Rédige un article sur un week-end à Saint-Gervais.',
      verifiedFacts: '',
      cityContext: { name: 'Saint-Gervais', slug: 'saint-gervais' },
    })

    expect(mockGetGenerativeModel).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        generationConfig: expect.objectContaining({
          responseMimeType: 'application/json',
        }),
      }),
    )
    expect(mockGetGenerativeModel).toHaveBeenNthCalledWith(
      2,
      expect.not.objectContaining({
        generationConfig: expect.anything(),
      }),
    )
    expect(result.sources).toEqual([
      { title: 'Office de tourisme', url: 'https://www.saintgervais.com/article' },
    ])
  })
})
