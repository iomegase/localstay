import { deriveElevationFromIgnProfile } from '@/features/trails-acquisition/services/ign'

describe('019 IGN elevation boundary', () => {
  it('derives positive elevation gain from altitude profile points', () => {
    expect(deriveElevationFromIgnProfile({ points: [{ z: 900 }, { z: 950 }, { z: 930 }, { z: 980 }] })).toEqual({
      elevation_gain_m: 100,
      elevation_status: 'valid',
      metric_source: 'ign',
    })
  })

  it('returns missing elevation when the profile has no usable points', () => {
    expect(deriveElevationFromIgnProfile({ points: [] })).toEqual({
      elevation_gain_m: null,
      elevation_status: 'missing',
      metric_source: null,
    })
  })
})
