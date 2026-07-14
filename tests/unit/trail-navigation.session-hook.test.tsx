/** @jest-environment jsdom */

import { act, renderHook } from '@testing-library/react'
import { useTrailNavigationSession } from '@/features/trail-navigation/hooks/useTrailNavigationSession'

function gpsPosition({ latitude=45.8731, longitude=6.673, accuracy=8, timestamp=10_000, altitude=null, altitudeAccuracy=null }: Partial<{latitude:number;longitude:number;accuracy:number;timestamp:number;altitude:number|null;altitudeAccuracy:number|null}> = {}): GeolocationPosition {
  return { coords: { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading:null, speed:null }, timestamp }
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
  })
})
