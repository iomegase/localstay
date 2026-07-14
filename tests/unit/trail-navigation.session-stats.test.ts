import {
  buildSessionSummary,
  calculateElevationGain,
  calculateSessionDistance,
  isTrailSessionStartEligible,
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

describe('021 trail session statistics', () => {
  it('AC-05-01/02: requires active GPS, a recent precise fix and <= 1500 m to the trail', () => {
    const current = point()
    expect(isTrailSessionStartEligible({ gpsActive: true, point: current, distanceToTrailM: 1_500, nowMs: 20_000 })).toBe(true)
    expect(isTrailSessionStartEligible({ gpsActive: false, point: current, distanceToTrailM: 100, nowMs: 20_000 })).toBe(false)
    expect(isTrailSessionStartEligible({ gpsActive: true, point: point({ accuracy: 30.1 }), distanceToTrailM: 100, nowMs: 20_000 })).toBe(false)
    expect(isTrailSessionStartEligible({ gpsActive: true, point: current, distanceToTrailM: 1_500.1, nowMs: 20_000 })).toBe(false)
    expect(isTrailSessionStartEligible({ gpsActive: true, point: current, distanceToTrailM: 100, nowMs: 20_001 })).toBe(false)
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

  it('BR-26: smooths reliable samples and ignores gains below 3 m', () => {
    const gain = calculateElevationGain([
      point({ altitude: 1_000, altitudeAccuracy: 8 }),
      point({ altitude: 1_001, altitudeAccuracy: 8 }),
      point({ altitude: 1_010, altitudeAccuracy: 8 }),
      point({ altitude: 1_015, altitudeAccuracy: 8 }),
    ])
    expect(gain).not.toBeNull()
    expect(gain).toBeGreaterThanOrEqual(3)
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
