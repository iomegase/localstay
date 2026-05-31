import {
  getLineEndpoints,
  getPositionProgress,
  getTrailDistanceMeters,
  isValidTrailGeometry,
  shouldAutoFollowCamera,
} from '@/features/trail-navigation/lib/geo'
import type { TrailGpsState } from '@/features/trail-navigation/lib/geo'

const line = {
  type: 'LineString',
  coordinates: [
    [6.7, 45.9],
    [6.71, 45.905],
    [6.72, 45.91],
  ],
} as const

describe('021 trail navigation geometry utilities', () => {
  it('AC-02-01: accepts LineString trail geometry and rejects point geometry', () => {
    expect(isValidTrailGeometry(line)).toBe(true)
    expect(isValidTrailGeometry({ type: 'Point', coordinates: [6.7, 45.9] })).toBe(false)
    expect(isValidTrailGeometry(null)).toBe(false)
  })

  it('AC-02-03: infers start and arrival markers from trail geometry', () => {
    expect(getLineEndpoints(line)).toEqual({
      start: { longitude: 6.7, latitude: 45.9 },
      end: { longitude: 6.72, latitude: 45.91 },
    })
  })

  it('AC-03-02/03: calculates distance to trail and off-track state locally', () => {
    const near = getTrailDistanceMeters({ latitude: 45.905, longitude: 6.71 }, line)
    const far = getTrailDistanceMeters({ latitude: 45.93, longitude: 6.76 }, line)

    expect(near).toBeLessThan(50)
    expect(far).toBeGreaterThan(120)
  })

  it('AC-03-04: calculates indicative progress along the trail', () => {
    const progress = getPositionProgress({ latitude: 45.905, longitude: 6.71 }, line)

    expect(progress.percent).toBeGreaterThan(30)
    expect(progress.percent).toBeLessThan(70)
    expect(progress.distance_m).toBeGreaterThan(0)
  })
})

describe('shouldAutoFollowCamera', () => {
  const activeStates: TrailGpsState[] = [
    'tracking',
    'approaching',
    'off_track',
    'ready_to_join',
    'pre_start',
    'low_accuracy',
  ]
  const idleStates: TrailGpsState[] = ['ready', 'gps_prompt', 'gps_denied']

  it('follows when GPS is active and following is enabled', () => {
    for (const state of activeStates) {
      expect(shouldAutoFollowCamera(state, true)).toBe(true)
    }
  })

  it('does not follow while GPS is idle, prompting, or denied', () => {
    for (const state of idleStates) {
      expect(shouldAutoFollowCamera(state, true)).toBe(false)
    }
  })

  it('never follows when following has been disabled (user panned the map)', () => {
    for (const state of [...activeStates, ...idleStates]) {
      expect(shouldAutoFollowCamera(state, false)).toBe(false)
    }
  })
})
