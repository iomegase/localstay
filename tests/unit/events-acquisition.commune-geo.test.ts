import { resolveCommune } from '@/features/events-acquisition/lib/commune-geo'

describe('resolveCommune (geo.api.gouv.fr)', () => {
  afterEach(() => jest.restoreAllMocks())

  it('résout par nom → insee + coords (centre GeoJSON [lon,lat])', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      json: async () => [
        { nom: 'Chamonix-Mont-Blanc', code: '74056', centre: { type: 'Point', coordinates: [6.8694, 45.9237] } },
      ],
    }))
    global.fetch = fetchMock as unknown as typeof fetch

    const r = await resolveCommune('chamonix')
    expect(r).toEqual({ insee: '74056', name: 'Chamonix-Mont-Blanc', latitude: 45.9237, longitude: 6.8694 })
    const url = String(fetchMock.mock.calls[0][0])
    expect(url).toContain('nom=chamonix')
    expect(url).toContain('codeDepartement=74')
  })

  it('résout par code INSEE (5 chiffres)', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      json: async () => [
        { nom: 'Saint-Gervais-les-Bains', code: '74236', centre: { type: 'Point', coordinates: [6.7123, 45.8923] } },
      ],
    }))
    global.fetch = fetchMock as unknown as typeof fetch

    const r = await resolveCommune('74236')
    expect(r!.insee).toBe('74236')
    expect(String(fetchMock.mock.calls[0][0])).toContain('code=74236')
  })

  it('renvoie null si aucun résultat', async () => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => [] })) as unknown as typeof fetch
    expect(await resolveCommune('zzzznope')).toBeNull()
  })
})
