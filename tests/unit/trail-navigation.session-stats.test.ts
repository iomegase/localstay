import {
  buildSessionSummary,
  calculateElevationGain,
  calculateSessionDistance,
  isTrailSessionStartEligible,
  toTrailSessionPoint,
} from '@/features/trail-navigation/lib/session-stats'
import type { TrailSessionPoint } from '@/features/trail-navigation/types'

function point(overrides: Partial<TrailSessionPoint> = {}): TrailSessionPoint {
  return {
    latitude: 45.8731,
    longitude: 6.673,
    accuracy: 8,
    timestampMs: 10_000,
    altitude: null,
    altitudeAccuracy: null,
    ...overrides,
  }
}

function position({
  altitude = 1_000,
  altitudeAccuracy = 8,
}: {
  altitude?: number | null
  altitudeAccuracy?: number | null
} = {}): GeolocationPosition {
  return {
    coords: {
      accuracy: 8,
      altitude,
      altitudeAccuracy,
      heading: null,
      latitude: 45.8731,
      longitude: 6.673,
      speed: null,
    },
    timestamp: 10_000,
  }
}

describe('021 trail session statistics', () => {
  it('AC-05-01/02: accepts inclusive accuracy, distance and fix-age boundaries', () => {
    const current = point()
    expect(isTrailSessionStartEligible({ gpsActive: true, point: current, distanceToTrailM: 1_500, nowMs: 20_000 })).toBe(true)
    expect(isTrailSessionStartEligible({ gpsActive: true, point: point({ accuracy: 30 }), distanceToTrailM: 1_500, nowMs: 20_000 })).toBe(true)
    expect(isTrailSessionStartEligible({ gpsActive: true, point: current, distanceToTrailM: 1_500, nowMs: 10_000 })).toBe(true)
  })

  it('AC-05-01/02: rejects inactive, stale, imprecise or distant starts', () => {
    const current = point()
    expect(isTrailSessionStartEligible({ gpsActive: false, point: current, distanceToTrailM: 100, nowMs: 20_000 })).toBe(false)
    expect(isTrailSessionStartEligible({ gpsActive: true, point: point({ accuracy: 30.1 }), distanceToTrailM: 100, nowMs: 20_000 })).toBe(false)
    expect(isTrailSessionStartEligible({ gpsActive: true, point: current, distanceToTrailM: 1_500.1, nowMs: 20_000 })).toBe(false)
    expect(isTrailSessionStartEligible({ gpsActive: true, point: current, distanceToTrailM: 100, nowMs: 20_001 })).toBe(false)
  })

  it('AC-05-01/02: rejects negative or non-finite accuracy and trail distance', () => {
    expect(isTrailSessionStartEligible({ gpsActive: true, point: point({ accuracy: -1 }), distanceToTrailM: 100, nowMs: 20_000 })).toBe(false)
    expect(isTrailSessionStartEligible({ gpsActive: true, point: point({ accuracy: Number.NaN }), distanceToTrailM: 100, nowMs: 20_000 })).toBe(false)
    expect(isTrailSessionStartEligible({ gpsActive: true, point: point({ accuracy: Number.POSITIVE_INFINITY }), distanceToTrailM: 100, nowMs: 20_000 })).toBe(false)
    expect(isTrailSessionStartEligible({ gpsActive: true, point: point(), distanceToTrailM: -1, nowMs: 20_000 })).toBe(false)
    expect(isTrailSessionStartEligible({ gpsActive: true, point: point(), distanceToTrailM: Number.NaN, nowMs: 20_000 })).toBe(false)
    expect(isTrailSessionStartEligible({ gpsActive: true, point: point(), distanceToTrailM: Number.POSITIVE_INFINITY, nowMs: 20_000 })).toBe(false)
  })

  it('maps a browser geolocation position to a trail session point', () => {
    expect(toTrailSessionPoint(position())).toEqual(
      point({ altitude: 1_000, altitudeAccuracy: 8 }),
    )
  })

  it('normalizes null or non-finite browser altitude values', () => {
    expect(toTrailSessionPoint(position({ altitude: null, altitudeAccuracy: null }))).toEqual(
      point({ altitude: null, altitudeAccuracy: null }),
    )
    expect(toTrailSessionPoint(position({
      altitude: Number.POSITIVE_INFINITY,
      altitudeAccuracy: Number.NaN,
    }))).toEqual(point({ altitude: null, altitudeAccuracy: null }))
  })

  it('normalizes negative browser altitude accuracy', () => {
    expect(toTrailSessionPoint(position({ altitudeAccuracy: -1 }))).toEqual(
      point({ altitude: 1_000, altitudeAccuracy: null }),
    )
  })

  it('AC-05-05: sums only the accepted session points supplied after the chosen start', () => {
    const points = [
      point({ latitude: 45.8731, timestampMs: 10_000 }),
      point({ latitude: 45.8731 + 10 / 111_320, timestampMs: 14_000 }),
      point({ latitude: 45.8731 + 20 / 111_320, timestampMs: 18_000 }),
    ]
    expect(calculateSessionDistance(points)).toBeCloseTo(20, 0)
  })

  it('BR-26: returns no elevation when fewer than three reliable altitude samples exist', () => {
    expect(calculateElevationGain([
      point({ altitude: 1_000, altitudeAccuracy: 10 }),
      point({ altitude: 1_010, altitudeAccuracy: 10 }),
    ])).toBeNull()
    expect(calculateElevationGain([
      point({ altitude: 1_000, altitudeAccuracy: 21 }),
      point({ altitude: 1_010, altitudeAccuracy: 21 }),
      point({ altitude: 1_020, altitudeAccuracy: 21 }),
    ])).toBeNull()
  })

  it('BR-26: excludes non-finite altitude and altitude accuracy samples', () => {
    expect(calculateElevationGain([
      point({ altitude: 1_000, altitudeAccuracy: 8 }),
      point({ altitude: Number.POSITIVE_INFINITY, altitudeAccuracy: 8 }),
      point({ altitude: 1_020, altitudeAccuracy: 8 }),
    ])).toBeNull()
    expect(calculateElevationGain([
      point({ altitude: 1_000, altitudeAccuracy: 8 }),
      point({ altitude: 1_010, altitudeAccuracy: Number.NEGATIVE_INFINITY }),
      point({ altitude: 1_020, altitudeAccuracy: 8 }),
    ])).toBeNull()
  })

  it('BR-26: excludes negative altitude accuracy samples', () => {
    expect(calculateElevationGain([
      point({ altitude: 1_000, altitudeAccuracy: 8 }),
      point({ altitude: 1_010, altitudeAccuracy: -1 }),
      point({ altitude: 1_020, altitudeAccuracy: 8 }),
    ])).toBeNull()
  })

  it('BR-26: median smoothing removes an isolated altitude spike', () => {
    expect(calculateElevationGain([
      point({ altitude: 1_000, altitudeAccuracy: 8 }),
      point({ altitude: 1_100, altitudeAccuracy: 8 }),
      point({ altitude: 1_000, altitudeAccuracy: 8 }),
    ])).toBe(0)
  })

  it('BR-26: ignores a smoothed gain below 3 m', () => {
    expect(calculateElevationGain([
      point({ altitude: 1_000, altitudeAccuracy: 8 }),
      point({ altitude: 1_002.9, altitudeAccuracy: 8 }),
      point({ altitude: 1_002.9, altitudeAccuracy: 8 }),
    ])).toBe(0)
  })

  it('BR-26: includes a smoothed gain of exactly 3 m', () => {
    expect(calculateElevationGain([
      point({ altitude: 1_000, altitudeAccuracy: 8 }),
      point({ altitude: 1_003, altitudeAccuracy: 8 }),
      point({ altitude: 1_003, altitudeAccuracy: 8 }),
    ])).toBe(3)
  })

  it('AC-05-08/09: freezes distance, duration and optional elevation in a summary', () => {
    const summary = buildSessionSummary({
      points: [
        point({ latitude: 45.8731, timestampMs: 10_000 }),
        point({ latitude: 45.8731 + 10 / 111_320, timestampMs: 14_000 }),
      ],
      startedAtMs: 10_000,
      stoppedAtMs: 70_000,
    })
    expect(summary.distanceM).toBeCloseTo(10, 0)
    expect(summary.durationSeconds).toBe(60)
    expect(summary.elevationGainM).toBeNull()
  })
})
