import { rejectGeminiGeoMetrics } from '@/features/trails-acquisition/lib/source-policy'

describe('019 trails acquisition Gemini guardrails', () => {
  it('keeps grounded metrics (post-Google-Search) but rejects raw coords & geometry', () => {
    // Avec grounding, Gemini extrait des chiffres factuels depuis le web réel
    // (visorando, camptocamp). On les accepte mais l'admin valide en revue.
    // En revanche on continue de rejeter les coords brutes et la geometry
    // qui sont des sujets purement géométriques réservés aux sources géo.
    const sanitized = rejectGeminiGeoMetrics({
      title: 'Mont Joly',
      description: 'Belle randonnée panoramique.',
      distance_km: 12,
      elevation_gain_m: 800,
      estimated_duration_min: 240,
      difficulty: 'medium',
      start_label: 'Plateau de la Croix',
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
      distance_km: 12,
      elevation_gain_m: 800,
      estimated_duration_min: 240,
      difficulty: 'medium',
      start_label: 'Plateau de la Croix',
      source_refs: [
        {
          type: 'gemini',
          attribution: 'Gemini',
          used_for: ['description'],
        },
      ],
    })
    // Pas de start_latitude/start_longitude/geometry_geojson : toujours rejetés
    expect(sanitized).not.toHaveProperty('start_latitude')
    expect(sanitized).not.toHaveProperty('geometry_geojson')
  })
})
