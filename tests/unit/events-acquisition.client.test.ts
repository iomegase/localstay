import { fetchEventsNear, fetchEventDetail } from '@/features/events-acquisition/lib/datatourisme-client'

describe('fetchEventsNear (API REST v1)', () => {
  afterEach(() => jest.restoreAllMocks())

  it('pagine via meta.next, agrège, envoie X-API-Key + geo_distance + fields', async () => {
    const page1 = {
      objects: [{ uuid: 'a' }],
      meta: { next: 'https://api.datatourisme.fr/v1/entertainmentAndEvent?page=2&crs=xyz' },
    }
    const page2 = { objects: [{ uuid: 'b' }], meta: { next: null } }
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => page1 })
      .mockResolvedValueOnce({ ok: true, json: async () => page2 })
    global.fetch = fetchMock as unknown as typeof fetch

    const objs = await fetchEventsNear({ latitude: 45.92, longitude: 6.86, radiusKm: 10, apiKey: 'KEY' })
    expect((objs as Array<{ uuid: string }>).map((o) => o.uuid)).toEqual(['a', 'b'])
    expect(fetchMock).toHaveBeenCalledTimes(2)

    const firstUrl = String(fetchMock.mock.calls[0][0])
    expect(firstUrl).toContain('entertainmentAndEvent')
    expect(decodeURIComponent(firstUrl)).toContain('geo_distance=45.92,6.86,10km')
    expect(firstUrl).toContain('fields=')
    const opts = fetchMock.mock.calls[0][1] as { headers: Record<string, string> }
    expect(opts.headers['X-API-Key']).toBe('KEY')
    expect(String(fetchMock.mock.calls[1][0])).toContain('page=2')
  })

  it('respecte maxPages (garde-fou anti-boucle)', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        objects: [{ uuid: 'x' }],
        meta: { next: 'https://api.datatourisme.fr/v1/entertainmentAndEvent?p=next' },
      }),
    }))
    global.fetch = fetchMock as unknown as typeof fetch

    const objs = await fetchEventsNear({ latitude: 1, longitude: 2, radiusKm: 5, apiKey: 'K', maxPages: 3 })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(objs).toHaveLength(3)
  })

  it('lève une erreur si la clé est absente', async () => {
    await expect(fetchEventsNear({ latitude: 1, longitude: 2, radiusKm: 5, apiKey: '' })).rejects.toThrow(
      'DATATOURISME_API_KEY',
    )
  })
})

describe('fetchEventDetail (API REST v1)', () => {
  afterEach(() => jest.restoreAllMocks())

  it('GET /v1/catalog/{uuid} avec X-API-Key et renvoie le JSON', async () => {
    const detail = { uuid: 'abc', hasMainRepresentation: [{ hasRelatedResource: [{ locator: ['https://img/x.jpg'] }] }] }
    const fetchMock = jest.fn(async () => ({ ok: true, json: async () => detail }))
    global.fetch = fetchMock as unknown as typeof fetch

    const res = await fetchEventDetail('abc', 'KEY')
    expect(res).toEqual(detail)
    const url = String(fetchMock.mock.calls[0][0])
    expect(url).toContain('/v1/catalog/abc')
    const opts = fetchMock.mock.calls[0][1] as { headers: Record<string, string> }
    expect(opts.headers['X-API-Key']).toBe('KEY')
  })

  it('lève une erreur si la clé est absente', async () => {
    await expect(fetchEventDetail('abc', '')).rejects.toThrow('DATATOURISME_API_KEY')
  })
})
