const mockGenerateContent = jest.fn()
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() { return { generateContent: (...args: unknown[]) => mockGenerateContent(...args) } }
  },
}))

import { generateTrailDescription } from '@/features/trails-acquisition/services/gemini-trails'

describe('spec 093 AC-03 — description d’une randonnée', () => {
  const env = process.env
  beforeEach(() => { process.env = { ...env, GEMINI_API_KEY: 'k' }; jest.clearAllMocks() })
  afterAll(() => { process.env = env })

  it('demande 120 à 300 mots et coupe à 300 mots', async () => {
    const sentence = 'Le sentier traverse des alpages fleuris avant de rejoindre un lac aux eaux claires.'
    const description = Array.from({ length: 40 }, () => sentence).join(' ')
    mockGenerateContent.mockResolvedValue({ response: { text: () => JSON.stringify({ description, start_label: 'Parking du Bettex' }) } })

    const result = await generateTrailDescription('Lac de Pormenaz', { name: 'Servoz', latitude: 45.93, longitude: 6.76 })

    expect(String(mockGenerateContent.mock.calls[0][0])).toContain('120 à 300 mots')
    expect(result.description.split(/\s+/).length).toBeLessThanOrEqual(300)
    expect(result.description.endsWith('claires.')).toBe(true)
    expect(result.start_label).toBe('Parking du Bettex')
  })
})
