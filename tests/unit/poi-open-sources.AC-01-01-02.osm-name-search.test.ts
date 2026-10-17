import { findOsmPlaceByName } from '@/features/geocoding/services/osm-name-geocoder'

const center = { latitude: 45.8214, longitude: 6.7272 }
const element = (id: number, lat: number, lon: number) => ({ type: 'node', id, lat, lon, tags: { name: 'Cascade de Combe Noire' } })

// Spec 101 AC-01-01/02/03 — recherche par nom dans OpenStreetMap (Overpass).
describe('101 — findOsmPlaceByName', () => {
  const originalFetch = global.fetch
  beforeEach(() => jest.spyOn(console, 'warn').mockImplementation(() => undefined))
  afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks() })

  it('AC-01-02 : retient l’élément le plus proche du centre ; nom exact sans casse, rayon de 30 km', async () => {
    const fetchMock = jest.fn(async () => Response.json({ elements: [element(1, 45.95, 6.9), element(2, 45.7800128, 6.7225317)] }))
    global.fetch = fetchMock as unknown as typeof fetch

    await expect(findOsmPlaceByName('Cascade de Combe Noire', center)).resolves.toEqual({ latitude: 45.7800128, longitude: 6.7225317, osm_type: 'node', osm_id: 2 })
    const body = new URLSearchParams(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body)).get('data')
    expect(body).toContain('nwr["name"~"^Cascade de Combe Noire$",i](around:30000,45.8214,6.7272)')
  })

  it('échappe les caractères spéciaux du nom', async () => {
    const fetchMock = jest.fn(async () => Response.json({ elements: [] }))
    global.fetch = fetchMock as unknown as typeof fetch
    await findOsmPlaceByName('Bar (Le "Q")', center)
    const body = new URLSearchParams(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body)).get('data')
    expect(body).toContain('^Bar \\(Le \\"Q\\"\\)$')
  })

  it('AC-01-03 : serveur saturé → serveur suivant ; tous en échec → null', async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(new Response('busy', { status: 502 }))
      .mockResolvedValueOnce(Response.json({ elements: [element(2, 45.78, 6.72)] }))
    global.fetch = fetchMock as unknown as typeof fetch
    await expect(findOsmPlaceByName('Cascade de Combe Noire', center)).resolves.toMatchObject({ osm_id: 2 })

    global.fetch = jest.fn(async () => new Response('busy', { status: 502 })) as unknown as typeof fetch
    await expect(findOsmPlaceByName('Cascade de Combe Noire', center)).resolves.toBeNull()
  })

  it('AC-01-03 : aucun élément → null', async () => {
    global.fetch = jest.fn(async () => Response.json({ elements: [] })) as unknown as typeof fetch
    await expect(findOsmPlaceByName('Inconnu du village', center)).resolves.toBeNull()
  })
})
