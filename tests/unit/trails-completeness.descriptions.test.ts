const mockGenerateContent = jest.fn()
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() { return { generateContent: (...args: unknown[]) => mockGenerateContent(...args) } }
  },
}))

import { enrichCandidatesWithGeminiDescriptions } from '@/features/trails-acquisition/services/gemini-trails'

// Audit 2026-10-08 : 0 description pour 35 tracés OSM, l'étape s'épuisant sur des candidats déjà décrits.
const city = { name: 'Les Contamines-Montjoie', latitude: 45.82, longitude: 6.72 }
const described = (title: string) => ({ title, description: 'Description Camptocamp existante.', start_label: null, geometry_status: 'valid', source_refs: [] as unknown })
const osm = (title: string) => ({ title, description: null as string | null, start_label: null as string | null, geometry_status: 'valid', source_refs: [] as unknown })
const gemini = (title: string) => ({ title, description: null as string | null, start_label: null as string | null, geometry_status: 'missing', source_refs: [] as unknown })

describe('descriptions Gemini des randonnées — sélection et ordre', () => {
  const env = process.env
  beforeEach(() => {
    process.env = { ...env, GEMINI_API_KEY: 'k' }
    jest.clearAllMocks()
    mockGenerateContent.mockImplementation(async (prompt: string) => ({
      response: { text: () => JSON.stringify({ description: `Texte pour ${/randonnée "([^"]+)"/.exec(prompt)?.[1]}. Deuxième phrase.`, start_label: 'Parking' }) },
    }))
  })
  afterAll(() => { process.env = env })

  it('ne rédige jamais pour un candidat déjà décrit (seul le départ manquait)', async () => {
    const items = [described('Depuis la Gittaz'), described('par l’arête W'), osm('Boucle de Miage')]
    const result = await enrichCandidatesWithGeminiDescriptions(items, city)
    expect(mockGenerateContent).toHaveBeenCalledTimes(1)
    expect(String(mockGenerateContent.mock.calls[0][0])).toContain('Boucle de Miage')
    expect(items[0]!.description).toBe('Description Camptocamp existante.')
    expect(result.enriched).toBe(1)
  })

  it('les tracés sans description passent avant les propositions sans tracé', async () => {
    const order: string[] = []
    mockGenerateContent.mockImplementation(async (prompt: string) => {
      order.push(/randonnée "([^"]+)"/.exec(prompt)?.[1] ?? '')
      return { response: { text: () => JSON.stringify({ description: 'Une phrase. Deux phrases.', start_label: null }) } }
    })
    const items = [gemini('Lac de Roselette'), gemini('Refuge de la Balme'), osm('Boucle de Miage')]
    for (let i = 0; i < 12; i += 1) items.push(osm(`Tracé ${i}`))
    await enrichCandidatesWithGeminiDescriptions(items, city)
    const firstGemini = order.findIndex(title => title === 'Lac de Roselette' || title === 'Refuge de la Balme')
    expect(firstGemini).toBeGreaterThanOrEqual(12)
    expect(order).toHaveLength(15)
  })
})
