import { isWithinAcquisitionRange, searchGooglePlaceCandidates } from '@/features/poi-acquisition/lib/google-places'

const mockGeocodeAddress = jest.fn()
jest.mock('@/features/geocoding/services/mapbox-client', () => ({
  geocodeAddress: (...args: unknown[]) => mockGeocodeAddress(...args),
}))

import { geocodeForAcquisition } from '@/features/poi-acquisition/lib/geocode'

// Règle globale des zones (AGENTS §10) — incident run « culture » Combloux du 2026-10-08.
const combloux = { latitude: 45.8969, longitude: 6.6411 }
const place = (id: string, name: string, latitude: number, longitude: number) => ({
  id,
  displayName: { text: name },
  formattedAddress: `${name}, adresse`,
  location: { latitude, longitude },
  primaryType: 'art_gallery',
  types: ['art_gallery'],
})

describe('acquisition — lieux hors zone (> 30 km)', () => {
  const originalEnv = process.env
  beforeEach(() => { process.env = { ...originalEnv, GOOGLE_PLACES_API_KEY: 'test-key' }; jest.clearAllMocks() })
  afterAll(() => { process.env = originalEnv })

  it('isWithinAcquisitionRange : ≤ 30 km gardé, au-delà écarté, sans position gardé', () => {
    expect(isWithinAcquisitionRange({ latitude: 45.857, longitude: 6.617 }, combloux)).toBe(true) // Megève
    expect(isWithinAcquisitionRange({ latitude: 46.204, longitude: 6.143 }, combloux)).toBe(false) // Genève
    expect(isWithinAcquisitionRange({ latitude: 48.871, longitude: 2.31 }, combloux)).toBe(false) // Paris
    expect(isWithinAcquisitionRange(null, combloux)).toBe(true)
  })

  it('la recherche Google écarte les galeries de Genève et de Paris renvoyées par locationBias', async () => {
    global.fetch = jest.fn(async () => Response.json({
      places: [
        place('megeve', 'Môabita Cube', 45.857, 6.617),
        place('geneve', 'Galerie Turetsky', 46.204, 6.143),
        place('paris', 'Galeries Bartoux', 48.871, 2.31),
      ],
    })) as unknown as typeof fetch

    const candidates = await searchGooglePlaceCandidates({
      cityName: 'Combloux', postalCode: '74920', categoryName: 'Culture', ...combloux,
    })
    expect(candidates.map(candidate => candidate.name)).toEqual(['Môabita Cube'])
  })

  it('géocodage : au-delà de 30 km toujours « rejected », même avec une adresse sûre', async () => {
    mockGeocodeAddress.mockResolvedValue({ latitude: 48.871, longitude: 2.31, relevance: 0.95 })
    await expect(geocodeForAcquisition('5 Av. Matignon, 75008 Paris', combloux)).resolves.toMatchObject({ status: 'rejected' })

    mockGeocodeAddress.mockResolvedValue({ latitude: 45.88, longitude: 6.65, relevance: 0.45 })
    await expect(geocodeForAcquisition('Route vague, Combloux', combloux)).resolves.toMatchObject({ status: 'pending_review' })
  })
})
