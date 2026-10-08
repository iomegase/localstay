import { enrichCandidatesWithDuration } from '@/features/trails-acquisition/services/ors'
import { cleanCamptocampMarkup } from '@/features/trails-acquisition/services/camptocamp'

// Incident 2026-10-08 : runs randonnée « partiels », durées manquantes.
const line = { type: 'LineString', coordinates: [[6.7, 45.8], [6.71, 45.81], [6.72, 45.82]] }
const candidate = (overrides: Record<string, unknown> = {}) => ({
  distance_km: 8 as number | null, elevation_gain_m: 600 as number | null, estimated_duration_min: null as number | null,
  geometry_geojson: line as unknown, source_refs: [] as unknown, ...overrides,
})

describe('durée des randonnées', () => {
  const env = process.env
  beforeEach(() => { process.env = { ...env, ORS_API_KEY: 'k' } })
  afterEach(() => { process.env = env })

  it('Naismith d’abord pour tous : une interruption d’ORS ne laisse aucun candidat sans durée', async () => {
    const controller = new AbortController()
    global.fetch = jest.fn(() => { controller.abort(new Error('Délai dépassé')); return Promise.reject(new Error('aborted')) }) as unknown as typeof fetch
    const items = [candidate(), candidate({ distance_km: 12 })]
    await expect(enrichCandidatesWithDuration(items, controller.signal)).rejects.toBeDefined()
    expect(items.map(item => item.estimated_duration_min)).toEqual([156, 204])
  })

  it('ORS remplace Naismith quand il répond ; un « non routable » (404) n’est pas un échec si Naismith a suppléé', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce(Response.json({ routes: [{ summary: { duration: 7200 } }] }))
      .mockResolvedValueOnce(new Response('{}', { status: 404 })) as unknown as typeof fetch
    const items = [candidate(), candidate()]
    const result = await enrichCandidatesWithDuration(items)
    expect(items.map(item => item.estimated_duration_min)).toEqual([120, 156])
    expect(result).toEqual({ naismith: 1, ors: 1, errors: 0 })
  })

  it('quota ORS atteint (429) : plus aucun appel ORS, Naismith conservé', async () => {
    const fetchMock = jest.fn(async () => new Response('{}', { status: 429 }))
    global.fetch = fetchMock as unknown as typeof fetch
    const items = [candidate(), candidate(), candidate()]
    await enrichCandidatesWithDuration(items)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(items.every(item => item.estimated_duration_min === 156)).toBe(true)
  })

  it('échec compté seulement quand aucune durée n’a pu être calculée', async () => {
    global.fetch = jest.fn(async () => new Response('{}', { status: 500 })) as unknown as typeof fetch
    const items = [candidate({ distance_km: null })]
    expect((await enrichCandidatesWithDuration(items)).errors).toBe(1)
  })
})

describe('descriptions Camptocamp', () => {
  it('balisage Camptocamp ramené à du Markdown standard', () => {
    expect(cleanCamptocampMarkup('##Aller\n[img=361438 right/]\nDepuis le parking, voir [[routes/12|la voie normale]].\n\n[warning]Prudence[/warning] [img=12 left]légende[/img]'))
      .toBe('## Aller\n\nDepuis le parking, voir la voie normale.\n\nPrudence')
  })
})
