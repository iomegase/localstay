import { validateTrailGeometry } from '@/features/trails-acquisition/lib/geojson'

describe('019 trail GeoJSON validation', () => {
  it('accepts LineString geometry and extracts the start point', () => {
    const result = validateTrailGeometry({
      type: 'LineString',
      coordinates: [
        [6.713, 45.891],
        [6.722, 45.9],
      ],
    })

    expect(result).toEqual({
      status: 'valid',
      geometry: {
        type: 'LineString',
        coordinates: [
          [6.713, 45.891],
          [6.722, 45.9],
        ],
      },
      start: { latitude: 45.891, longitude: 6.713 },
    })
  })

  it('rejects invalid geometry without throwing', () => {
    expect(validateTrailGeometry({ type: 'Point', coordinates: [6.713, 45.891] })).toEqual({
      status: 'invalid',
      geometry: null,
      start: null,
    })
  })
})
