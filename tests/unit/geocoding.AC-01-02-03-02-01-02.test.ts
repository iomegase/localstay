import { geocodeAddress } from '../../src/features/geocoding/services/mapbox-client'
import { validateGeocode } from '../../src/features/geocoding/services/geo-validator'

describe('geocodeAddress', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'test-token'
  })

  it('returns null when Mapbox returns no features', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ features: [] }),
    } as unknown as Response)

    const result = await geocodeAddress('adresse inconnue xyz', {
      longitude: 6.7085,
      latitude: 45.8921,
    })

    expect(result).toBeNull()
  })

  it('returns GeocodeResult when Mapbox returns a feature', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            center: [6.712, 45.895],
            relevance: 0.9,
            place_name: '22 Rue de la Comtesse, Saint-Gervais-les-Bains',
          },
        ],
      }),
    } as unknown as Response)

    const result = await geocodeAddress('22 Rue de la Comtesse, 74170 Saint-Gervais-les-Bains', {
      longitude: 6.7085,
      latitude: 45.8921,
    })

    expect(result).toEqual({
      latitude: 45.895,
      longitude: 6.712,
      relevance: 0.9,
      place_name: '22 Rue de la Comtesse, Saint-Gervais-les-Bains',
    })
  })

  it('throws when NEXT_PUBLIC_MAPBOX_TOKEN is not set', async () => {
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = ''
    await expect(
      geocodeAddress('une adresse', { longitude: 6.7085, latitude: 45.8921 })
    ).rejects.toThrow('NEXT_PUBLIC_MAPBOX_TOKEN not set')
  })

  it('throws when Mapbox API returns non-ok status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
    } as unknown as Response)

    await expect(
      geocodeAddress('une adresse', { longitude: 6.7085, latitude: 45.8921 })
    ).rejects.toThrow('Mapbox API error: 429')
  })
})

const CITY_CENTER = { latitude: 45.8921, longitude: 6.7085 }

describe('validateGeocode — AC-02-01 / AC-02-02', () => {
  it('AC-02-02: rejects when relevance < 0.5', () => {
    const result = validateGeocode(
      { latitude: 45.895, longitude: 6.712, relevance: 0.4, place_name: 'x' },
      CITY_CENTER,
    )
    expect(result.valid).toBe(false)
    expect(result.reason).toMatch(/confidence/)
  })

  it('AC-02-01: rejects when distance > 30 km', () => {
    const result = validateGeocode(
      { latitude: 45.748, longitude: 4.847, relevance: 0.9, place_name: 'Lyon' },
      CITY_CENTER,
    )
    expect(result.valid).toBe(false)
    expect(result.reason).toMatch(/distance/)
  })

  it('accepts a valid nearby result', () => {
    const result = validateGeocode(
      { latitude: 45.8213, longitude: 6.7279, relevance: 0.85, place_name: 'Les Contamines' },
      CITY_CENTER,
    )
    expect(result.valid).toBe(true)
  })

  it('accepts a result at ~30km (Les Gets, ~29km from Saint-Gervais)', () => {
    const result = validateGeocode(
      { latitude: 46.157, longitude: 6.668, relevance: 0.8, place_name: 'Les Gets' },
      CITY_CENTER,
    )
    expect(result.valid).toBe(true)
  })
})
