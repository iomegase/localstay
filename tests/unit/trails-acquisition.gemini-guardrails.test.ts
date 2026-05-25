import { rejectGeminiGeoMetrics } from '@/features/trails-acquisition/lib/source-policy'

describe('019 trails acquisition Gemini guardrails', () => {
  it('removes geographic metrics from Gemini candidates', () => {
    const sanitized = rejectGeminiGeoMetrics({
      title: 'Mont Joly',
      description: 'Belle randonnée panoramique.',
      distance_km: 12,
      elevation_gain_m: 800,
      estimated_duration_min: 240,
      start_latitude: 45.89,
      start_longitude: 6.71,
      geometry_geojson: { type: 'LineString', coordinates: [] },
      source_refs: [
        {
          type: 'gemini',
          attribution: 'Gemini',
          used_for: ['description'],
        },
      ],
    })

    expect(sanitized).toEqual({
      title: 'Mont Joly',
      description: 'Belle randonnée panoramique.',
      source_refs: [
        {
          type: 'gemini',
          attribution: 'Gemini',
          used_for: ['description'],
        },
      ],
    })
  })
})
