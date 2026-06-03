import {
  getLineEndpoints,
  getPositionProgress,
  getTrailDistanceMeters,
  isValidTrailGeometry,
  shouldAcceptTrackPoint,
  shouldAutoFollowCamera,
  smoothTrack,
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
  // 1° lat ≈ 111 320 m
  const movedSixMeters = { latitude: 45.9 + 6 / 111_320, longitude: 6.7 }
  const movedTwoMeters = { latitude: 45.9 + 2 / 111_320, longitude: 6.7 }
  const movedHundredMeters = { latitude: 45.9 + 100 / 111_320, longitude: 6.7 }

  it('rejects an imprecise fix (accuracy above the max threshold)', () => {
    expect(
      shouldAcceptTrackPoint({ last: null, lastAcceptedAtMs: null, next: origin, accuracy: 31, nowMs: 1_000 }),
    ).toBe(false)
  })

  it('accepts the first precise point when there is no previous point', () => {
    expect(
      shouldAcceptTrackPoint({ last: null, lastAcceptedAtMs: null, next: origin, accuracy: 10, nowMs: 1_000 }),
    ).toBe(true)
  })

  it('rejects a point recorded too soon (below the minimum interval of 3 s)', () => {
    expect(
      shouldAcceptTrackPoint({ last: origin, lastAcceptedAtMs: 1_000, next: movedSixMeters, accuracy: 10, nowMs: 2_500 }),
    ).toBe(false)
  })

  it('rejects a point that barely moved (below the minimum step of 5 m)', () => {
    expect(
      shouldAcceptTrackPoint({ last: origin, lastAcceptedAtMs: 1_000, next: movedTwoMeters, accuracy: 10, nowMs: 6_000 }),
    ).toBe(false)
  })

  it('accepts a precise point that moved ≥5 m after ≥3 s at a plausible speed', () => {
    expect(
      shouldAcceptTrackPoint({ last: origin, lastAcceptedAtMs: 1_000, next: movedSixMeters, accuracy: 10, nowMs: 5_000 }),
    ).toBe(true)
  })

  it('rejects a GPS jump (implausible speed, e.g. 100 m in 4 s ≈ 25 m/s)', () => {
    expect(
      shouldAcceptTrackPoint({ last: origin, lastAcceptedAtMs: 1_000, next: movedHundredMeters, accuracy: 10, nowMs: 5_000 }),
    ).toBe(false)
  })

  it('accepts a large gap covered slowly (e.g. after a GPS signal loss)', () => {
    // 100 m en 120 s ≈ 0.8 m/s → plausible, on raccroche le tracé
    expect(
      shouldAcceptTrackPoint({ last: origin, lastAcceptedAtMs: 1_000, next: movedHundredMeters, accuracy: 10, nowMs: 121_000 }),
    ).toBe(true)
  })

  it('honours custom thresholds', () => {
    expect(
      shouldAcceptTrackPoint(
        { last: origin, lastAcceptedAtMs: 1_000, next: movedSixMeters, accuracy: 10, nowMs: 5_000 },
        { minStepM: 10, maxAccuracyM: 30, minIntervalMs: 3_000, maxSpeedMps: 8 },
      ),
    ).toBe(false)
  })
})

describe('smoothTrack', () => {
  it('returns the input unchanged when there are fewer than 3 points', () => {
    expect(smoothTrack([])).toEqual([])
    expect(smoothTrack([[6.7, 45.9]])).toEqual([[6.7, 45.9]])
    expect(smoothTrack([[6.7, 45.9], [6.71, 45.9]])).toEqual([[6.7, 45.9], [6.71, 45.9]])
  })

  it('preserves the number of points', () => {
    const points: Array<[number, number]> = [
      [0, 0], [1, 0], [2, 5], [3, 0], [4, 0],
    ]
    expect(smoothTrack(points)).toHaveLength(points.length)
  })

  it('attenuates an isolated spike toward its neighbours', () => {
    const points: Array<[number, number]> = [
      [0, 0], [1, 0], [2, 5], [3, 0], [4, 0],
    ]
    const smoothed = smoothTrack(points)
    // Le pic (lat 5) est tiré vers la ligne sans l'effacer complètement
    expect(smoothed[2][1]).toBeLessThan(5)
    expect(smoothed[2][1]).toBeGreaterThan(0)
  })
})
