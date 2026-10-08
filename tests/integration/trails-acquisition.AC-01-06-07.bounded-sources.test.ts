const mockC2c = jest.fn()
const mockIgn = jest.fn()
const mockGemini = jest.fn()
const mockDescriptions = jest.fn()
const mockGeocode = jest.fn()
const mockDuration = jest.fn()
jest.mock('@/features/trails-acquisition/services/camptocamp', () => ({ fetchCamptocampTrails: (...args: unknown[]) => mockC2c(...args) }))
jest.mock('@/features/trails-acquisition/services/ign', () => ({ enrichCandidatesWithIgn: (...args: unknown[]) => mockIgn(...args) }))
jest.mock('@/features/trails-acquisition/services/gemini-trails', () => ({
  discoverTrailsWithGemini: (...args: unknown[]) => mockGemini(...args),
  enrichCandidatesWithGeminiDescriptions: (...args: unknown[]) => mockDescriptions(...args),
  extractStartLabelFromDescription: () => null,
}))
jest.mock('@/features/trails-acquisition/services/start-geocoding', () => ({ enrichCandidatesWithStartGeocoding: (...args: unknown[]) => mockGeocode(...args) }))
jest.mock('@/features/trails-acquisition/services/ors', () => ({ enrichCandidatesWithDuration: (...args: unknown[]) => mockDuration(...args) }))
import { collectTrailCandidatesFromSources, type RunSourceResult } from '@/features/trails-acquisition/services/run-orchestrator'
import { IMPORT_IGN_TIMEOUT_MS, IMPORT_WORK_BUDGET_MS, runWithDeadline } from '@/features/trails-acquisition/lib/import-budget'

const city = { id: 'city', name: 'Combloux', latitude: 45, longitude: 6 }
const candidate = { primary_source_type: 'camptocamp', source_refs: [], raw_payload: {}, title: 'Mont Joly', description: 'Description existante' }
beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
  mockC2c.mockResolvedValue([candidate])
  mockGemini.mockResolvedValue([])
  for (const mock of [mockIgn, mockDescriptions, mockGeocode, mockDuration]) mock.mockResolvedValue({ errors: 0 })
})
afterEach(() => jest.useRealTimers())
it('persists discovery before IGN starts and retains partial enrichment on timeout', async () => {
  const snapshots: RunSourceResult[] = []
  let draft: RunSourceResult['candidates'] = []
  mockIgn.mockImplementation(async items => {
    expect(snapshots[0].candidates).toHaveLength(1)
    draft = items
    draft[0].elevation_gain_m = 400
    return new Promise(() => {})
  })
  const promise = collectTrailCandidatesFromSources({ city, sourceTypes: ['camptocamp', 'ign'] }, async snapshot => { snapshots.push(snapshot) })
  await jest.advanceTimersByTimeAsync(IMPORT_IGN_TIMEOUT_MS + 1)
  const result = await promise
  expect(result.candidates[0].elevation_gain_m).toBe(400)
  expect(result.source_errors.ign).toContain('Délai dépassé')
  draft[0].elevation_gain_m = 9999
  expect(result.candidates[0].elevation_gain_m).toBe(400)
  expect(snapshots[0].candidates[0].elevation_gain_m).toBeUndefined()
})
it('starts discovery sources independently and survives one hanging source', async () => {
  mockC2c.mockImplementation(() => new Promise(() => {}))
  mockGemini.mockResolvedValue([{ title: 'Lac Vert', description: 'Une balade autour du lac', start_label: 'Parking du lac' }])
  const promise = collectTrailCandidatesFromSources({ city, sourceTypes: ['camptocamp', 'gemini'] })
  expect(mockGemini).toHaveBeenCalledTimes(1)
  await jest.advanceTimersByTimeAsync(65_001)
  const result = await promise
  expect(result.candidates).toHaveLength(1)
  expect(result.source_errors.camptocamp).toContain('Délai dépassé')
})
it('reports item-level enrichment failures', async () => {
  mockIgn.mockResolvedValue({ errors: 2 })
  const result = await collectTrailCandidatesFromSources({ city, sourceTypes: ['camptocamp', 'ign'] })
  expect(result.source_errors.ign).toBe('2 enrichissement(s) en échec')
})
it('aborts timed-out work and refuses to start work after the deadline', async () => {
  let signal: AbortSignal | undefined
  const work = jest.fn(async (value: AbortSignal) => { signal = value; return new Promise(() => {}) })
  const promise = runWithDeadline(Date.now() + 100, 50, work)
  const assertion = expect(promise).rejects.toThrow('Délai dépassé')
  await jest.advanceTimersByTimeAsync(51)
  await assertion
  expect(signal?.aborted).toBe(true)
  work.mockClear()
  await expect(runWithDeadline(Date.now() - 1, 50, work)).rejects.toThrow('Budget')
  expect(work).not.toHaveBeenCalled()
})


it('retains Camptocamp routes received before a hanging detail times out', async () => {
  mockC2c.mockImplementation(async input => {
    input.onCandidate(candidate)
    return new Promise(() => {})
  })
  const promise = collectTrailCandidatesFromSources({ city, sourceTypes: ['camptocamp'] })
  await jest.advanceTimersByTimeAsync(65_001)
  const result = await promise
  expect(result.candidates).toHaveLength(1)
  expect(result.candidates[0].title).toBe('Mont Joly')
  expect(result.source_errors.camptocamp).toContain('Délai dépassé')
})

it('skips all expired phases without repeatedly writing checkpoints', async () => {
  // Juste après le budget de travail (270 s depuis le 2026-10-08).
  const checkpoint = jest.fn(async () => { jest.setSystemTime(Date.now() + IMPORT_WORK_BUDGET_MS + 1_000) })
  const result = await collectTrailCandidatesFromSources({ city, sourceTypes: ['camptocamp', 'ign', 'gemini'] }, checkpoint)
  expect(checkpoint).toHaveBeenCalledTimes(1)
  expect(mockIgn).not.toHaveBeenCalled()
  expect(mockDescriptions).not.toHaveBeenCalled()
  expect(mockGeocode).not.toHaveBeenCalled()
  expect(mockDuration).not.toHaveBeenCalled()
  expect(result.source_errors).toEqual(expect.objectContaining({ ign: expect.stringContaining('Budget'), duration: expect.stringContaining('Budget') }))
})

it('tries a backup Overpass server before the total source timeout when the primary hangs', async () => {
  const originalFetch = global.fetch
  const originalEndpoint = process.env.OVERPASS_API_URL
  process.env.OVERPASS_API_URL = 'https://overpass.example/api/interpreter'
  const fetchMock = jest.fn().mockImplementationOnce(() => new Promise(() => {})).mockResolvedValueOnce({
    ok: true, json: async () => ({ elements: [{ type: 'way', id: 1, tags: { route: 'hiking', name: 'Sentier test' }, geometry: [{ lat: 45, lon: 6 }, { lat: 45.001, lon: 6.001 }] }] }),
  })
  global.fetch = fetchMock
  try {
    const promise = collectTrailCandidatesFromSources({ city, sourceTypes: ['overpass'] })
    await jest.advanceTimersByTimeAsync(20_501)
    const result = await promise
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result.candidates[0].geometry_status).toBe('valid')
    expect(result.source_errors.overpass).toBeUndefined()
  } finally {
    global.fetch = originalFetch
    if (originalEndpoint === undefined) delete process.env.OVERPASS_API_URL
    else process.env.OVERPASS_API_URL = originalEndpoint
  }
})

it('2026-10-08 : durée calculée avant les descriptions Gemini, qui ont leur propre délai de 120 s', async () => {
  const order: string[] = []
  mockDuration.mockImplementation(async () => { order.push('duration'); return { errors: 0 } })
  mockDescriptions.mockImplementation(async (_items: unknown, _city: unknown, signal: AbortSignal) => {
    order.push('descriptions')
    await new Promise(resolve => setTimeout(resolve, 60_000))
    return { errors: signal.aborted ? 1 : 0 }
  })
  const promise = collectTrailCandidatesFromSources({ city, sourceTypes: ['camptocamp', 'ign', 'gemini'] })
  await jest.advanceTimersByTimeAsync(61_000)
  const result = await promise
  expect(order).toEqual(['duration', 'descriptions'])
  expect(result.source_errors.gemini_descriptions).toBeUndefined()
})

