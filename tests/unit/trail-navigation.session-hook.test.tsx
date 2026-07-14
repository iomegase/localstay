/** @jest-environment jsdom */

import { act, renderHook } from '@testing-library/react'
import { useTrailNavigationSession } from '@/features/trail-navigation/hooks/useTrailNavigationSession'

type GpsPositionOverrides = Partial<{
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
  altitude: number | null
  altitudeAccuracy: number | null
}>

function gpsPosition({
  latitude = 45.8731,
  longitude = 6.673,
  accuracy = 8,
  timestamp = 10_000,
  altitude = null,
  altitudeAccuracy = null,
}: GpsPositionOverrides = {}): GeolocationPosition {
  return {
    coords: {
      latitude,
      longitude,
      accuracy,
      altitude,
      altitudeAccuracy,
      heading: null,
      speed: null,
    },
    timestamp,
  }
}

describe('021 trail navigation session hook', () => {
  it('AC-05-01/02/03: starts only with a recent reliable point inside the inclusive start zone', () => {
    let nowMs = 20_000
    const { result } = renderHook(() => useTrailNavigationSession({
      stopGps: jest.fn(),
      now: () => nowMs,
    }))

    act(() => {
      result.current.markGpsPrompting()
      result.current.receiveGpsPosition(gpsPosition(), 1_500)
    })

    expect(result.current.phase).toBe('ready_to_join')
    expect(result.current.canStart).toBe(true)

    act(() => {
      nowMs = 20_001
      result.current.refreshClock()
    })

    expect(result.current.canStart).toBe(false)
  })

  it('AC-05-04/05/06: snapshots the chosen start, measures accepted movement, and enters tracking', () => {
    let nowMs = 20_000
    const { result } = renderHook(() => useTrailNavigationSession({
      stopGps: jest.fn(),
      now: () => nowMs,
    }))

    act(() => {
      result.current.markGpsPrompting()
      result.current.receiveGpsPosition(gpsPosition(), 500)
    })
    act(() => {
      expect(result.current.startSession()).toBe(true)
    })

    expect(result.current.phase).toBe('approaching')
    expect(result.current.points).toHaveLength(1)
    expect(result.current.points[0].timestampMs).toBe(20_000)

    act(() => {
      nowMs = 24_000
      result.current.receiveGpsPosition(gpsPosition({
        latitude: 45.8731 + 10 / 111_320,
        timestamp: nowMs,
      }), 35)
    })

    expect(result.current.distanceM).toBeCloseTo(10, 0)
    expect(result.current.phase).toBe('tracking')
  })

  it('AC-05-04: starts directly in tracking when already within 35 metres of the trail', () => {
    const { result } = renderHook(() => useTrailNavigationSession({
      stopGps: jest.fn(),
      now: () => 20_000,
    }))

    act(() => {
      result.current.markGpsPrompting()
      result.current.receiveGpsPosition(gpsPosition(), 20)
    })
    act(() => {
      expect(result.current.startSession()).toBe(true)
    })

    expect(result.current.phase).toBe('tracking')
  })

  it('AC-05-04: cannot restart and reset an active session', () => {
    let nowMs = 20_000
    const { result } = renderHook(() => useTrailNavigationSession({
      stopGps: jest.fn(),
      now: () => nowMs,
    }))

    act(() => {
      result.current.markGpsPrompting()
      result.current.receiveGpsPosition(gpsPosition(), 500)
      expect(result.current.startSession()).toBe(true)
    })
    act(() => {
      nowMs = 24_000
      result.current.receiveGpsPosition(gpsPosition({
        latitude: 45.8731 + 10 / 111_320,
        timestamp: nowMs,
      }), 35)
    })

    const pointsBeforeRestart = result.current.points
    const distanceBeforeRestart = result.current.distanceM
    act(() => {
      nowMs = 25_000
      expect(result.current.startSession()).toBe(false)
    })

    expect(result.current.points).toEqual(pointsBeforeRestart)
    expect(result.current.distanceM).toBe(distanceBeforeRestart)

    act(() => {
      nowMs = 80_000
      result.current.stopSession()
    })
    expect(result.current.summary?.durationSeconds).toBe(60)
  })

  it.each([
    ['NaN latitude', { latitude: Number.NaN }],
    ['infinite latitude', { latitude: Number.POSITIVE_INFINITY }],
    ['latitude above 90', { latitude: 90.1 }],
    ['latitude below -90', { latitude: -90.1 }],
    ['NaN longitude', { longitude: Number.NaN }],
    ['infinite longitude', { longitude: Number.NEGATIVE_INFINITY }],
    ['longitude above 180', { longitude: 180.1 }],
    ['longitude below -180', { longitude: -180.1 }],
    ['NaN accuracy', { accuracy: Number.NaN }],
    ['infinite accuracy', { accuracy: Number.POSITIVE_INFINITY }],
    ['negative accuracy', { accuracy: -1 }],
    ['NaN timestamp', { timestamp: Number.NaN }],
    ['infinite timestamp', { timestamp: Number.POSITIVE_INFINITY }],
    ['negative timestamp', { timestamp: -1 }],
  ] satisfies Array<[string, GpsPositionOverrides]>)('rejects a malformed GPS fix with %s before it corrupts current state', (_label, overrides) => {
    const { result } = renderHook(() => useTrailNavigationSession({
      stopGps: jest.fn(),
      now: () => 20_000,
    }))

    act(() => {
      result.current.markGpsPrompting()
      result.current.receiveGpsPosition(gpsPosition(), 100)
    })
    const chosenPoint = result.current.latestPoint

    act(() => {
      result.current.receiveGpsPosition(gpsPosition(overrides), 900)
    })

    expect(result.current.latestPoint).toEqual(chosenPoint)
    expect(result.current.distanceToTrailM).toBe(100)
    expect(result.current.phase).toBe('ready_to_join')
  })

  it('preserves tracking state for an invalid trail distance and only toggles off-track from valid distances', () => {
    let nowMs = 20_000
    const { result } = renderHook(() => useTrailNavigationSession({
      stopGps: jest.fn(),
      now: () => nowMs,
    }))

    act(() => {
      result.current.markGpsPrompting()
      result.current.receiveGpsPosition(gpsPosition(), 20)
      expect(result.current.startSession()).toBe(true)
    })
    act(() => {
      nowMs = 24_000
      result.current.receiveGpsPosition(gpsPosition({ timestamp: nowMs }), Number.NaN)
    })

    expect(result.current.phase).toBe('tracking')
    expect(result.current.isOffTrack).toBe(false)

    act(() => {
      nowMs = 28_000
      result.current.receiveGpsPosition(gpsPosition({ timestamp: nowMs }), 36)
    })
    expect(result.current.isOffTrack).toBe(true)

    act(() => {
      nowMs = 32_000
      result.current.receiveGpsPosition(gpsPosition({ timestamp: nowMs }), 35)
    })
    expect(result.current.phase).toBe('tracking')
    expect(result.current.isOffTrack).toBe(false)
  })

  it('makes a reliable pre-start fix ineligible when GPS permission is denied', () => {
    const { result } = renderHook(() => useTrailNavigationSession({
      stopGps: jest.fn(),
      now: () => 20_000,
    }))

    act(() => {
      result.current.markGpsPrompting()
      result.current.receiveGpsPosition(gpsPosition(), 100)
    })
    expect(result.current.canStart).toBe(true)

    act(() => {
      result.current.markGpsDenied()
    })

    expect(result.current.gpsHealth).toBe('denied')
    expect(result.current.canStart).toBe(false)
  })

  it('preserves collected session state after permission denial and still allows stopping', () => {
    let nowMs = 20_000
    const stopGps = jest.fn()
    const { result } = renderHook(() => useTrailNavigationSession({
      stopGps,
      now: () => nowMs,
    }))

    act(() => {
      result.current.markGpsPrompting()
      result.current.receiveGpsPosition(gpsPosition(), 20)
      expect(result.current.startSession()).toBe(true)
    })
    act(() => {
      nowMs = 24_000
      result.current.receiveGpsPosition(gpsPosition({
        latitude: 45.8731 + 10 / 111_320,
        timestamp: nowMs,
      }), 20)
      result.current.markGpsDenied()
    })

    expect(result.current.gpsHealth).toBe('denied')
    expect(result.current.isActive).toBe(true)
    expect(result.current.points).toHaveLength(2)

    act(() => {
      nowMs = 80_000
      result.current.stopSession()
    })
    expect(result.current.phase).toBe('stopped')
    expect(result.current.summary?.distanceM).toBeCloseTo(10, 0)
    expect(stopGps).toHaveBeenCalledTimes(1)
  })

  it('AC-05-08/10: keeps a GPS-lost session active and stops it idempotently with frozen statistics', () => {
    let nowMs = 20_000
    const stopGps = jest.fn()
    const { result } = renderHook(() => useTrailNavigationSession({
      stopGps,
      now: () => nowMs,
    }))

    act(() => {
      result.current.markGpsPrompting()
      result.current.receiveGpsPosition(gpsPosition(), 20)
      expect(result.current.startSession()).toBe(true)
    })
    act(() => {
      result.current.markGpsUnavailable()
    })

    expect(result.current.gpsHealth).toBe('unavailable')
    expect(result.current.isActive).toBe(true)

    act(() => {
      nowMs = 80_000
      result.current.stopSession()
      result.current.stopSession()
    })

    expect(stopGps).toHaveBeenCalledTimes(1)
    expect(result.current.phase).toBe('stopped')
    expect(result.current.summary?.durationSeconds).toBe(60)
    expect(result.current.elapsedSeconds).toBe(60)

    const stoppedPoint = result.current.latestPoint
    const stoppedDistance = result.current.distanceToTrailM
    const stoppedPoints = result.current.points
    act(() => {
      result.current.receiveGpsPosition(gpsPosition({
        latitude: 46,
        timestamp: 90_000,
      }), 900)
    })
    expect(result.current.latestPoint).toEqual(stoppedPoint)
    expect(result.current.distanceToTrailM).toBe(stoppedDistance)
    expect(result.current.points).toEqual(stoppedPoints)
  })
})
