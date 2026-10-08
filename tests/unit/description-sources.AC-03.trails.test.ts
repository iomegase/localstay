const mockGenerateContent = jest.fn()
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() { return { generateContent: (...args: unknown[]) => mockGenerateContent(...args) } }
  },
}))

import { generateTrailDescription } from '@/features/trails-acquisition/services/gemini-trails'

describe('spec 094 AC-03 — sources des descriptions de randonnée', () => {
  const env = process.env
  beforeEach(() => { process.env = { ...env, GEMINI_API_KEY: 'k' }; jest.clearAllMocks() })
  afterAll(() => { process.env = env })

  it('les pages citées par la recherche Google de Gemini deviennent les sources', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({ description: 'Le sentier longe le torrent. Il rejoint un lac alpin.', start_label: null }),
        candidates: [{ groundingMetadata: { groundingChunks: [
          { web: { uri: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/abc', title: 'visorando.com' } },
          { web: { uri: 'https://www.servoz.fr/randonnees', title: 'Mairie de Servoz' } },
        ] } }],
      },
    })
    const result = await generateTrailDescription('Lac de Pormenaz', { name: 'Servoz', latitude: 45.93, longitude: 6.76 })
    expect(result.description_sources).toEqual([
      { url: 'https://visorando.com', title: 'visorando.com' },
      { url: 'https://www.servoz.fr/randonnees', title: 'Mairie de Servoz' },
    ])
  })
})
