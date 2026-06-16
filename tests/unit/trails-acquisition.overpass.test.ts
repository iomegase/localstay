import { normalizeOverpassTrails } from '@/features/trails-acquisition/services/overpass'
import { collectTrailCandidatesFromSources } from '@/features/trails-acquisition/services/run-orchestrator'

describe('019 Overpass trail normalization', () => {
  it('normalizes hiking relations with geometry into trail candidates', () => {
    const candidates = normalizeOverpassTrails({
      elements: [
        {
          type: 'relation',
          id: 42,
          tags: { route: 'hiking', name: 'Boucle du Mont Joly', sac_scale: 'mountain_hiking' },
          geometry: [
            { lat: 45.891, lon: 6.713 },
            { lat: 45.9, lon: 6.722 },
          ],
        },
      ],
    })

    expect(candidates).toHaveLength(1)
    expect(candidates[0]).toMatchObject({
      primary_source_type: 'overpass',
      title: 'Boucle du Mont Joly',
      geometry_status: 'valid',
      start_latitude: 45.891,
      start_longitude: 6.713,
      difficulty: 'medium',
      metric_source: 'computed_geometry',
    })
    expect(candidates[0].distance_km).toBeGreaterThan(1)
  })

  it('keeps unnamed raw paths as enrichment context instead of candidates', () => {
    const candidates = normalizeOverpassTrails({
      elements: [
        {
          type: 'way',
          id: 99,
          tags: { highway: 'path' },
          geometry: [
            { lat: 45.891, lon: 6.713 },
            { lat: 45.9, lon: 6.722 },
          ],
        },
      ],
    })

    expect(candidates).toEqual([])
  })

  it('calls Overpass with JSON accept and MyStay user agent headers', async () => {
    const originalEndpoint = process.env.OVERPASS_API_URL
    process.env.OVERPASS_API_URL = 'https://overpass.example/api/interpreter'
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        elements: [
          {
            type: 'relation',
            id: 42,
            tags: { route: 'hiking', name: 'Boucle du Mont Joly' },
            geometry: [
              { lat: 45.891, lon: 6.713 },
              { lat: 45.9, lon: 6.722 },
            ],
          },
        ],
      }),
    } as Response)

    try {
      const result = await collectTrailCandidatesFromSources({
        city: {
          id: 'city-1',
          name: 'Saint-Gervais-les-Bains',
          latitude: 45.892,
          longitude: 6.713,
        },
        sourceTypes: ['overpass'],
        zoneRadiusKm: 15,
      })

      expect(result.candidates).toHaveLength(1)
      expect(fetchMock).toHaveBeenCalledWith(
        'https://overpass.example/api/interpreter',
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: 'application/json',
            'User-Agent': expect.stringContaining('MyStay'),
          }),
        }),
      )
    } finally {
      fetchMock.mockRestore()
      process.env.OVERPASS_API_URL = originalEndpoint
    }
  })
})
