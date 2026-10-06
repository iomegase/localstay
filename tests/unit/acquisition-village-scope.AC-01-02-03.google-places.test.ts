import {
  getGooglePlaceCandidate,
  searchGooglePlaceCandidates,
  searchGooglePlacesByName,
} from '@/features/poi-acquisition/lib/google-places'
import { nearestActiveCity } from '@/features/poi-acquisition/lib/village'

// Spec 066 — périmètre village, statut d'ouverture, pagination, recherche par nom.
const originalEnv = process.env

const SAINT_GERVAIS = { id: 'city-sg', slug: 'saint-gervais-les-bains', name: 'Saint-Gervais-les-Bains', latitude: 45.89227, longitude: 6.712007 }
const SAINT_NICOLAS = { id: 'city-sn', slug: 'saint-nicolas-de-veroce', name: 'Saint-Nicolas-de-Véroce', latitude: 45.863934, longitude: 6.717467 }
const COMBLOUX = { id: 'city-cb', slug: 'combloux', name: 'Combloux', latitude: 45.894476, longitude: 6.645167 }
const CITIES = [SAINT_GERVAIS, SAINT_NICOLAS, COMBLOUX]

function place(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    displayName: { text: id },
    formattedAddress: '74170 Saint-Gervais-les-Bains, France',
    location: { latitude: 45.8925, longitude: 6.7122 },
    businessStatus: 'OPERATIONAL',
    ...overrides,
  }
}

const searchParams = {
  cityName: 'Saint-Gervais-les-Bains',
  postalCode: '74170',
  categoryName: 'Dîner',
  latitude: SAINT_GERVAIS.latitude,
  longitude: SAINT_GERVAIS.longitude,
}

describe('066 AC-01-01 / BR-02 — village de rattachement', () => {
  it('retient la City active dont le centre est le plus proche', () => {
    // Bistrot du Mont Joly : adresse « Saint-Gervais », position à Saint-Nicolas.
    expect(nearestActiveCity({ latitude: 45.8605, longitude: 6.7181 }, CITIES, SAINT_GERVAIS.id)?.slug)
      .toBe('saint-nicolas-de-veroce')
    expect(nearestActiveCity({ latitude: 45.8925, longitude: 6.7122 }, CITIES, SAINT_GERVAIS.id)?.slug)
      .toBe('saint-gervais-les-bains')
  })

  it('départage une égalité en faveur de la City du run', () => {
    const twin = { ...SAINT_GERVAIS, id: 'city-twin', slug: 'jumelle' }
    expect(nearestActiveCity({ latitude: 45.8925, longitude: 6.7122 }, [twin, SAINT_GERVAIS], SAINT_GERVAIS.id)?.slug)
      .toBe('saint-gervais-les-bains')
  })

  it('AC-01-03 : sans position, pas de rattachement', () => {
    expect(nearestActiveCity(null, CITIES, SAINT_GERVAIS.id)).toBeNull()
  })
})

describe('066 Google Places', () => {
  beforeEach(() => {
    process.env = { ...originalEnv, GOOGLE_PLACES_API_KEY: 'test-key' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('AC-02-01 : demande businessStatus, location et le jeton de page suivante', async () => {
    const masks: string[] = []
    global.fetch = jest.fn(async (_input, init) => {
      masks.push(String((init?.headers as Record<string, string>)['X-Goog-FieldMask']))
      return Response.json({ places: [] })
    })

    await searchGooglePlaceCandidates(searchParams)

    expect(masks[0]).toContain('places.businessStatus')
    expect(masks[0]).toContain('places.location')
    expect(masks[0]).toContain('nextPageToken')
  })

  it('AC-02 : expose statut d’ouverture et position sur chaque candidat', async () => {
    global.fetch = jest.fn(async () => Response.json({
      places: [place('le-galeta', { businessStatus: 'CLOSED_TEMPORARILY' }), place('sans-statut', { businessStatus: undefined, location: undefined })],
    }))

    const candidates = await searchGooglePlaceCandidates(searchParams)

    expect(candidates.map(candidate => [candidate.google_place_id, candidate.business_status, candidate.location])).toEqual([
      ['le-galeta', 'CLOSED_TEMPORARILY', { latitude: 45.8925, longitude: 6.7122 }],
      ['sans-statut', null, null],
    ])
  })

  it('AC-03-01 / AC-03-02 : lit jusqu’à 3 pages par requête et dédoublonne', async () => {
    const bodies: Array<{ textQuery: string; pageToken?: string }> = []
    global.fetch = jest.fn(async (_input, init) => {
      const body = JSON.parse(String(init?.body)) as { textQuery: string; pageToken?: string }
      bodies.push(body)
      if (!body.pageToken) return Response.json({ places: [place('a'), place('b')], nextPageToken: 'p2' })
      if (body.pageToken === 'p2') return Response.json({ places: [place('b'), place('c')], nextPageToken: 'p3' })
      if (body.pageToken === 'p3') return Response.json({ places: [place('d')], nextPageToken: 'p4' })
      return Response.json({ places: [place('jamais-lu')] })
    })

    const candidates = await searchGooglePlaceCandidates(searchParams)

    expect(bodies.map(body => body.pageToken ?? null)).toEqual([null, 'p2', 'p3'])
    expect(bodies.every(body => body.textQuery === 'Dîner Saint-Gervais-les-Bains')).toBe(true)
    expect(candidates.map(candidate => candidate.google_place_id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('AC-04-01 : la recherche par nom renvoie 5 résultats au plus, fermés compris', async () => {
    const bodies: Array<{ textQuery: string; pageSize?: number }> = []
    global.fetch = jest.fn(async (_input, init) => {
      bodies.push(JSON.parse(String(init?.body)))
      return Response.json({
        places: ['1', '2', '3', '4', '5', '6'].map(id => place(`p${id}`, { businessStatus: id === '1' ? 'CLOSED_TEMPORARILY' : 'OPERATIONAL' })),
      })
    })

    const results = await searchGooglePlacesByName({
      query: 'Le Galeta',
      cityName: 'Saint-Gervais-les-Bains',
      latitude: SAINT_GERVAIS.latitude,
      longitude: SAINT_GERVAIS.longitude,
    })

    expect(bodies[0]).toMatchObject({ textQuery: 'Le Galeta Saint-Gervais-les-Bains', pageSize: 5 })
    expect(results).toHaveLength(5)
    expect(results[0]).toMatchObject({ google_place_id: 'p1', business_status: 'CLOSED_TEMPORARILY' })
  })

  it('AC-04-02 : charge un lieu précis par son identifiant Google', async () => {
    const urls: string[] = []
    global.fetch = jest.fn(async input => {
      urls.push(String(input))
      return Response.json(place('le-galeta', { businessStatus: 'CLOSED_TEMPORARILY', websiteUri: 'https://galeta.example' }))
    })

    const candidate = await getGooglePlaceCandidate('le-galeta')

    expect(urls[0]).toBe('https://places.googleapis.com/v1/places/le-galeta?languageCode=fr')
    expect(candidate).toMatchObject({
      google_place_id: 'le-galeta',
      name: 'le-galeta',
      website: 'https://galeta.example',
      business_status: 'CLOSED_TEMPORARILY',
    })
  })
})
