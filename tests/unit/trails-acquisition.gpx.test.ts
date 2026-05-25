import { parseGpxToGeoJson } from '@/features/trails-acquisition/lib/gpx'

describe('019 trail GPX parser', () => {
  it('converts GPX track points to GeoJSON LineString', () => {
    const result = parseGpxToGeoJson(`
      <gpx>
        <trk><trkseg>
          <trkpt lat="45.891" lon="6.713"></trkpt>
          <trkpt lat="45.900" lon="6.722"></trkpt>
        </trkseg></trk>
      </gpx>
    `)

    expect(result).toEqual({
      status: 'valid',
      geometry: {
        type: 'LineString',
        coordinates: [
          [6.713, 45.891],
          [6.722, 45.9],
        ],
      },
    })
  })

  it('rejects GPX with fewer than two valid points', () => {
    expect(parseGpxToGeoJson('<gpx><trkpt lat="45.891" lon="6.713" /></gpx>')).toEqual({
      status: 'invalid',
      geometry: null,
    })
  })
})
