const mockGenerate = jest.fn()
const mockModel = jest.fn(() => ({ generateContent: mockGenerate }))
const mockReadSource = jest.fn()
jest.mock('@google/generative-ai', () => ({ ...jest.requireActual('@google/generative-ai'), GoogleGenerativeAI: jest.fn(() => ({ getGenerativeModel: mockModel })) }))
jest.mock('@/features/poi-description-assistance/services/official-source', () => ({ readOfficialDescriptionSource: (...args: unknown[]) => mockReadSource(...args) }))

import { generatePoiDescription } from '@/features/poi-description-assistance/services/generate-description'
import { DescriptionAssistanceError } from '@/features/poi-description-assistance/lib/contracts'
import { GoogleGenerativeAIFetchError } from '@google/generative-ai'

const identity = { name: 'Refuge du Mont-Joly', address: 'Saint-Gervais-les-Bains', city: 'Saint-Gervais-les-Bains', website: null }
const description = 'Ce chalet accueille les randonneurs. Il propose une restauration familiale.'
const source = { source_url: 'https://refuge.example/refuge', attribution: 'refuge.example', text: 'Chalet refuge pour les randonneurs, restauration familiale.' }
function generated(overrides = {}, metadata: object = {}) {
  return { response: { text: () => JSON.stringify({ matches_poi: true, sufficient_sources: true, description, ...overrides }), candidates: [{ finishReason: 'STOP', groundingMetadata: metadata }] } }
}
const apiKey = process.env.GEMINI_API_KEY
afterAll(() => { if (apiKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = apiKey })
beforeEach(() => { jest.clearAllMocks(); process.env.GEMINI_API_KEY = 'test-only'; mockReadSource.mockResolvedValue(source) })
beforeEach(() => { jest.spyOn(console, 'error').mockImplementation(() => {}) })
afterEach(() => { jest.restoreAllMocks() })

it('AC-01: uses the official page and does not enable search', async () => {
  mockGenerate.mockResolvedValue(generated())
  await expect(generatePoiDescription({ ...identity, website: source.source_url })).resolves.toEqual({ description, source_mode: 'official_website', sources: [{ title: source.attribution, url: source.source_url }], search_entry_point: null })
  expect(mockReadSource).toHaveBeenCalledWith(source.source_url)
  expect(mockModel.mock.calls[0][0]).not.toHaveProperty('tools')
  expect(mockGenerate.mock.calls[0][0]).toContain(source.text)
})

it('AC-02: uses provider citations, deduplicates and preserves the search entry point', async () => {
  const web = { uri: 'https://tourisme.example/refuge', title: 'Office de tourisme' }
  mockGenerate.mockResolvedValue(generated({}, { groundingChunks: [{ web }, { web }, { web: { uri: 'javascript:alert(1)', title: 'Unsafe' } }], searchEntryPoint: { renderedContent: '<div>Google</div>' } }))
  await expect(generatePoiDescription(identity)).resolves.toEqual({ description, source_mode: 'web_search', sources: [{ url: web.uri, title: web.title }], search_entry_point: '<div>Google</div>' })
  expect(mockReadSource).not.toHaveBeenCalled()
  expect(mockModel).toHaveBeenCalledWith(expect.objectContaining({ tools: [{ googleSearch: {} }] }))
  expect(mockModel.mock.calls[0][0].generationConfig).not.toHaveProperty('responseMimeType')
})

it.each([{ matches_poi: false }, { sufficient_sources: false }, { description: null }, { description: '' }])('AC-03: rejects mismatched or insufficient evidence %p', async overrides => {
  mockGenerate.mockResolvedValue(generated(overrides))
  await expect(generatePoiDescription({ ...identity, website: source.source_url })).rejects.toMatchObject({ code: 'DESCRIPTION_SOURCES_INSUFFICIENT' })
})

it('AC-03: excludes conflicting facts and homonyms in the model instructions', async () => {
  mockGenerate.mockResolvedValue(generated())
  await generatePoiDescription({ ...identity, website: source.source_url })
  const prompt = mockModel.mock.calls[0][0].systemInstruction
  expect(prompt).toContain('écarte les homonymes')
  expect(prompt).toContain('Omet les détails contradictoires')
  expect(prompt).toContain('Ne fournis ni coordonnées GPS')
})

it('AC-04: rejects web output without provider sources even if the model claims sources', async () => {
  mockGenerate.mockResolvedValue(generated({ sources: ['https://invented.example'] }))
  await expect(generatePoiDescription(identity)).rejects.toMatchObject({ code: 'DESCRIPTION_SOURCES_INSUFFICIENT' })
})

it('AC-04: unreadable official page never falls back to web or an empty success', async () => {
  mockReadSource.mockRejectedValue(new DescriptionAssistanceError('SOURCE_URL_UNREADABLE'))
  await expect(generatePoiDescription({ ...identity, website: source.source_url })).rejects.toMatchObject({ code: 'SOURCE_URL_UNREADABLE' })
  expect(mockGenerate).not.toHaveBeenCalled()
})

it.each(['', 'not json', JSON.stringify({ matches_poi: true, sufficient_sources: true, description: 'x'.repeat(2001) })])('AC-04: rejects malformed or oversized results', async text => {
  mockGenerate.mockResolvedValue({ response: { text: () => text } })
  await expect(generatePoiDescription(identity)).rejects.toMatchObject({ code: 'DESCRIPTION_GENERATION_FAILED' })
})

it('AC-04: hides provider errors and reports unavailable configuration', async () => {
  mockGenerate.mockRejectedValue(new Error('provider secret payload'))
  await expect(generatePoiDescription(identity)).rejects.toMatchObject({ code: 'DESCRIPTION_GENERATION_FAILED' })
  delete process.env.GEMINI_API_KEY
  await expect(generatePoiDescription(identity)).rejects.toMatchObject({ code: 'DESCRIPTION_SERVICE_UNAVAILABLE' })
})

it('AC-04: rejects a single-sentence description', async () => {
  mockGenerate.mockResolvedValue(generated({ description: 'Une seule phrase.' }))
  await expect(generatePoiDescription({ ...identity, website: source.source_url })).rejects.toMatchObject({ code: 'DESCRIPTION_GENERATION_FAILED' })
})

it('spec 093 AC-02 / AC-04 : texte développé accepté, coupé à la dernière phrase sous 300 mots', async () => {
  const sentence = 'Cette adresse accueille les visiteurs dans un cadre chaleureux au cœur du village alpin.'
  const long = Array.from({ length: 30 }, () => sentence).join(' ')
  mockGenerate.mockResolvedValue(generated({ description: long }))
  const result = await generatePoiDescription({ ...identity, website: source.source_url })
  const words = result.description.split(/\s+/).length
  expect(words).toBeLessThanOrEqual(300)
  expect(words).toBeGreaterThan(250)
  expect(result.description.endsWith('alpin.')).toBe(true)
})

it.each([429, 503])('AC-04: maps provider unavailability %s to a retryable service error', async status => {
  mockGenerate.mockRejectedValue(new GoogleGenerativeAIFetchError('Provider error', status, 'Unavailable'))
  await expect(generatePoiDescription(identity)).rejects.toMatchObject({ code: 'DESCRIPTION_SERVICE_UNAVAILABLE', status: 503 })
})
