import {
  getLineEndpoints,
  getPositionProgress,
  getTrailDistanceMeters,
  isValidTrailGeometry,
  shouldAcceptTrackPoint,
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

describe('shouldAcceptTrackPoint', () => {
  const origin = { latitude: 45.9, longitude: 6.7 }
  // ~3 m au nord de l'origine (1° lat ≈ 111 320 m → 3 m ≈ 0.0000269°)
  const movedThreeMeters = { latitude: 45.9 + 0.0000269, longitude: 6.7 }
  // ~1 m au nord de l'origine
  const movedOneMeter = { latitude: 45.9 + 0.0000090, longitude: 6.7 }

  it('rejects an imprecise fix (accuracy above the max threshold)', () => {
    expect(shouldAcceptTrackPoint(null, origin, 30)).toBe(false)
    expect(shouldAcceptTrackPoint(origin, movedThreeMeters, 26)).toBe(false)
  })

  it('accepts the first precise point when there is no previous point', () => {
    expect(shouldAcceptTrackPoint(null, origin, 10)).toBe(true)
  })

  it('accepts a precise point that moved at least the minimum step (2 m)', () => {
    expect(shouldAcceptTrackPoint(origin, movedThreeMeters, 10)).toBe(true)
  })

  it('rejects a precise point that barely moved (below the minimum step)', () => {
    expect(shouldAcceptTrackPoint(origin, movedOneMeter, 10)).toBe(false)
  })

  it('honours custom step and accuracy thresholds', () => {
    // step relevé à 5 m → un déplacement de 3 m est refusé
    expect(shouldAcceptTrackPoint(origin, movedThreeMeters, 10, { minStepM: 5, maxAccuracyM: 25 })).toBe(false)
    // accuracy max relevée à 40 m → un fix à 30 m est accepté
    expect(shouldAcceptTrackPoint(null, origin, 30, { minStepM: 2, maxAccuracyM: 40 })).toBe(true)
  })
})
