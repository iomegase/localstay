import { describe, it, expect, vi, beforeEach } from 'vitest'
import { geocodeAddress } from '../../src/features/geocoding/services/mapbox-client'

describe('geocodeAddress', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_MAPBOX_TOKEN', 'test-token')
  })

  it('returns null when Mapbox returns no features', async () => {
    global.fetch = vi.fn().mockResolvedValue({
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
    global.fetch = vi.fn().mockResolvedValue({
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
    vi.stubEnv('NEXT_PUBLIC_MAPBOX_TOKEN', '')
    await expect(
      geocodeAddress('une adresse', { longitude: 6.7085, latitude: 45.8921 })
    ).rejects.toThrow('NEXT_PUBLIC_MAPBOX_TOKEN not set')
  })

  it('throws when Mapbox API returns non-ok status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
    } as unknown as Response)

    await expect(
      geocodeAddress('une adresse', { longitude: 6.7085, latitude: 45.8921 })
    ).rejects.toThrow('Mapbox API error: 429')
  })
})
