# Trail Entry Session Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Autoriser une session randonnée locale depuis toute position GPS fiable située à 1 500 m ou moins du tracé, compter la distance réelle depuis ce départ et afficher un récapitulatif figé après un arrêt manuel.

**Architecture:** Séparer la phase de session et la santé GPS dans un hook client dédié. Garder les calculs de distance et de dénivelé dans une bibliothèque pure, puis laisser `TrailNavigationMap` orchestrer Mapbox, le suivi navigateur et les composants de présentation sans transmettre la trace à une API.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Mapbox GL via `react-map-gl`, Tailwind CSS, Jest, Testing Library.

---

## File map

- Create `src/features/trail-navigation/lib/session-stats.ts`: critères de départ, conversion des positions, distance cumulée, dénivelé filtré et résumé figé.
- Create `src/features/trail-navigation/hooks/useTrailNavigationSession.ts`: phase de session, santé GPS, chronomètre, points acceptés, arrêt idempotent.
- Create `src/features/trail-navigation/components/TrailSessionSummaryModal.tsx`: récapitulatif accessible avec métriques conditionnelles.
- Create `tests/unit/trail-navigation.session-stats.test.ts`: règles pures `AC-05-01` à `AC-05-05` et `BR-26`.
- Create `tests/unit/trail-navigation.session-hook.test.tsx`: transitions, remise à zéro, arrêt et perte GPS.
- Create `tests/unit/trail-navigation.session-summary-modal.test.tsx`: rendu conditionnel et actions de la modale.
- Create `tests/integration/trail-navigation.session-flow.test.tsx`: flux GPS → départ → approche/tracking → Stop → récapitulatif.
- Modify `src/features/trail-navigation/types.ts`: types de phase, santé, point et résumé de session.
- Modify `src/features/trail-navigation/lib/geo.ts`: exporter Haversine et adapter le suivi caméra à la phase de session.
- Modify `src/features/trail-navigation/components/TrailNavigationMap.tsx`: brancher le hook, appliquer 1 500 m, conserver l'approche, afficher Stop et supprimer l'envoi GPS vers l'API.
- Modify `src/features/trail-navigation/components/NavigationHud.tsx`: afficher la distance réelle après démarrage sans la confondre avec la progression officielle.
- Modify `tests/unit/trail-navigation.geo.test.ts`: nouvelle signature du suivi caméra.
- Modify `tests/unit/trail-navigation.start-map.test.tsx`: nouvelles règles de démarrage, approche et arrêt.
- Modify `docs/traceability-matrix.md`: lier `AC-05-*` et `BR-20` à `BR-28` aux sources et tests.
- Delete `src/app/api/trails/walking-route/route.ts`: supprimer le chemin qui reçoit la position utilisateur, incompatible avec `BR-28`.

## Task 1: Add pure session statistics and eligibility rules

**Files:**
- Modify: `src/features/trail-navigation/types.ts`
- Modify: `src/features/trail-navigation/lib/geo.ts`
- Create: `src/features/trail-navigation/lib/session-stats.ts`
- Create: `tests/unit/trail-navigation.session-stats.test.ts`

- [ ] **Step 1: Write the failing statistics tests**

Create `tests/unit/trail-navigation.session-stats.test.ts` with explicit boundaries and no browser rendering:

```ts
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
```

- [ ] **Step 2: Run the new test and verify the module is missing**

Run:

```bash
npm test -- tests/unit/trail-navigation.session-stats.test.ts --runInBand
```

Expected: FAIL with `Cannot find module '@/features/trail-navigation/lib/session-stats'`.

- [ ] **Step 3: Add the session types**

Append to `src/features/trail-navigation/types.ts`:

```ts
export type TrailSessionPhase =
  | 'idle'
  | 'pre_start'
  | 'ready_to_join'
  | 'approaching'
  | 'tracking'
  | 'stopped'

export type TrailGpsHealth =
  | 'inactive'
  | 'prompting'
  | 'good'
  | 'low_accuracy'
  | 'denied'
  | 'unavailable'

export type TrailSessionPoint = TrailCoordinate & {
  accuracy: number
  timestampMs: number
  altitude: number | null
  altitudeAccuracy: number | null
}

export type TrailSessionSummary = {
  distanceM: number
  durationSeconds: number
  elevationGainM: number | null
}
```

- [ ] **Step 4: Export the existing Haversine helper**

In `src/features/trail-navigation/lib/geo.ts`, change the private declaration to:

```ts
export function haversineMeters(from: TrailCoordinate, to: TrailCoordinate): number {
```

Do not duplicate a second Haversine implementation.

- [ ] **Step 5: Implement the pure statistics module**

Create `src/features/trail-navigation/lib/session-stats.ts`:

```ts
import type { TrailSessionPoint, TrailSessionSummary } from '../types'
import { haversineMeters } from './geo'

export const SESSION_START_MAX_DISTANCE_M = 1_500
export const SESSION_START_MAX_ACCURACY_M = 30
export const SESSION_START_MAX_AGE_MS = 10_000
export const SESSION_TRACKING_DISTANCE_M = 35
export const ALTITUDE_MAX_ACCURACY_M = 20
export const ALTITUDE_MIN_GAIN_M = 3
export const ALTITUDE_MIN_SAMPLES = 3

type EligibilityInput = {
  gpsActive: boolean
  point: TrailSessionPoint | null
  distanceToTrailM: number | null
  nowMs: number
}

export function isTrailSessionStartEligible({
  gpsActive,
  point,
  distanceToTrailM,
  nowMs,
}: EligibilityInput): boolean {
  if (!gpsActive || point === null || distanceToTrailM === null) return false
  const ageMs = nowMs - point.timestampMs
  return (
    ageMs >= 0 &&
    ageMs <= SESSION_START_MAX_AGE_MS &&
    point.accuracy <= SESSION_START_MAX_ACCURACY_M &&
    distanceToTrailM <= SESSION_START_MAX_DISTANCE_M
  )
}

export function toTrailSessionPoint(position: GeolocationPosition): TrailSessionPoint {
  const { altitude, altitudeAccuracy } = position.coords
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestampMs: position.timestamp,
    altitude: typeof altitude === 'number' && Number.isFinite(altitude) ? altitude : null,
    altitudeAccuracy: typeof altitudeAccuracy === 'number' && Number.isFinite(altitudeAccuracy)
      ? altitudeAccuracy
      : null,
  }
}

export function calculateSessionDistance(points: readonly TrailSessionPoint[]): number {
  let totalM = 0
  for (let index = 1; index < points.length; index += 1) {
    totalM += haversineMeters(points[index - 1], points[index])
  }
  return totalM
}

export function calculateElevationGain(points: readonly TrailSessionPoint[]): number | null {
  const altitudes = points
    .filter(point => (
      point.altitude !== null &&
      point.altitudeAccuracy !== null &&
      point.altitudeAccuracy <= ALTITUDE_MAX_ACCURACY_M
    ))
    .map(point => point.altitude as number)

  if (altitudes.length < ALTITUDE_MIN_SAMPLES) return null

  const smoothed = altitudes.map((altitude, index) => median([
    altitudes[Math.max(0, index - 1)],
    altitude,
    altitudes[Math.min(altitudes.length - 1, index + 1)],
  ]))

  let gainM = 0
  for (let index = 1; index < smoothed.length; index += 1) {
    const deltaM = smoothed[index] - smoothed[index - 1]
    if (deltaM >= ALTITUDE_MIN_GAIN_M) gainM += deltaM
  }
  return Math.round(gainM)
}

export function buildSessionSummary({
  points,
  startedAtMs,
  stoppedAtMs,
}: {
  points: readonly TrailSessionPoint[]
  startedAtMs: number
  stoppedAtMs: number
}): TrailSessionSummary {
  return {
    distanceM: calculateSessionDistance(points),
    durationSeconds: Math.max(0, (stoppedAtMs - startedAtMs) / 1_000),
    elevationGainM: calculateElevationGain(points),
  }
}

function median(values: [number, number, number]): number {
  return [...values].sort((left, right) => left - right)[1]
}
```

- [ ] **Step 6: Run the statistics and existing geo tests**

Run:

```bash
npm test -- tests/unit/trail-navigation.session-stats.test.ts tests/unit/trail-navigation.geo.test.ts --runInBand
```

Expected: PASS for both suites.

- [ ] **Step 7: Commit the pure domain layer**

```bash
git add src/features/trail-navigation/types.ts src/features/trail-navigation/lib/geo.ts src/features/trail-navigation/lib/session-stats.ts tests/unit/trail-navigation.session-stats.test.ts
git commit -m "feat: add trail session statistics"
```

## Task 2: Add the local session hook and orthogonal GPS health

**Files:**
- Create: `src/features/trail-navigation/hooks/useTrailNavigationSession.ts`
- Create: `tests/unit/trail-navigation.session-hook.test.tsx`

- [ ] **Step 1: Write failing hook tests**

Create `tests/unit/trail-navigation.session-hook.test.tsx` using `renderHook` and a mutable clock:

```tsx
/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { useTrailNavigationSession } from '@/features/trail-navigation/hooks/useTrailNavigationSession'

function gpsPosition({
  latitude = 45.8731,
  longitude = 6.673,
  accuracy = 8,
  timestamp = 10_000,
  altitude = null,
  altitudeAccuracy = null,
}: Partial<{
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
  altitude: number | null
  altitudeAccuracy: number | null
}> = {}): GeolocationPosition {
  return {
    coords: { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading: null, speed: null },
    timestamp,
  }
}

describe('useTrailNavigationSession', () => {
  it('AC-05-01/02/03: derives ready_to_join only for an eligible fix', () => {
    let nowMs = 20_000
    const { result } = renderHook(() => useTrailNavigationSession({ stopGps: jest.fn(), now: () => nowMs }))
    act(() => result.current.markGpsPrompting())
    act(() => result.current.receiveGpsPosition(gpsPosition(), 1_500))
    expect(result.current.phase).toBe('ready_to_join')
    expect(result.current.canStart).toBe(true)
    nowMs = 20_001
    act(() => result.current.refreshClock())
    expect(result.current.canStart).toBe(false)
  })

  it('AC-05-04/05/06: snapshots the click position, counts approach and reaches tracking', () => {
    let nowMs = 20_000
    const { result } = renderHook(() => useTrailNavigationSession({ stopGps: jest.fn(), now: () => nowMs }))
    act(() => result.current.markGpsPrompting())
    act(() => result.current.receiveGpsPosition(gpsPosition(), 500))
    act(() => result.current.startSession())
    expect(result.current.phase).toBe('approaching')
    expect(result.current.points).toHaveLength(1)
    nowMs = 24_000
    act(() => result.current.receiveGpsPosition(gpsPosition({ latitude: 45.8731 + 10 / 111_320, timestamp: 24_000 }), 100))
    expect(result.current.distanceM).toBeCloseTo(10, 0)
    nowMs = 28_000
    act(() => result.current.receiveGpsPosition(gpsPosition({ latitude: 45.8731 + 20 / 111_320, timestamp: 28_000 }), 35))
    expect(result.current.phase).toBe('tracking')
  })

  it('AC-05-04: starts directly in tracking when the chosen point is already <= 35 m away', () => {
    const { result } = renderHook(() => useTrailNavigationSession({ stopGps: jest.fn(), now: () => 20_000 }))
    act(() => result.current.markGpsPrompting())
    act(() => result.current.receiveGpsPosition(gpsPosition(), 20))
    act(() => result.current.startSession())
    expect(result.current.phase).toBe('tracking')
  })

  it('AC-05-08/10: stops once and preserves a frozen partial summary after GPS loss', () => {
    let nowMs = 20_000
    const stopGps = jest.fn()
    const { result } = renderHook(() => useTrailNavigationSession({ stopGps, now: () => nowMs }))
    act(() => result.current.markGpsPrompting())
    act(() => result.current.receiveGpsPosition(gpsPosition(), 100))
    act(() => result.current.startSession())
    act(() => result.current.markGpsUnavailable())
    expect(result.current.isActive).toBe(true)
    nowMs = 80_000
    act(() => result.current.stopSession())
    act(() => result.current.stopSession())
    expect(stopGps).toHaveBeenCalledTimes(1)
    expect(result.current.phase).toBe('stopped')
    expect(result.current.summary?.durationSeconds).toBe(60)
  })
})
```

- [ ] **Step 2: Run the hook test and verify it fails**

Run:

```bash
npm test -- tests/unit/trail-navigation.session-hook.test.tsx --runInBand
```

Expected: FAIL because `useTrailNavigationSession` does not exist.

- [ ] **Step 3: Implement the hook with phase and health kept separate**

Create `src/features/trail-navigation/hooks/useTrailNavigationSession.ts`. The exported API must match the tests exactly:

```ts
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  TrailGpsHealth,
  TrailSessionPhase,
  TrailSessionPoint,
  TrailSessionSummary,
} from '../types'
import { shouldAcceptTrackPoint } from '../lib/geo'
import {
  buildSessionSummary,
  calculateSessionDistance,
  isTrailSessionStartEligible,
  SESSION_START_MAX_ACCURACY_M,
  SESSION_START_MAX_AGE_MS,
  SESSION_START_MAX_DISTANCE_M,
  SESSION_TRACKING_DISTANCE_M,
  toTrailSessionPoint,
} from '../lib/session-stats'

type Options = {
  stopGps: () => void
  now?: () => number
}

const ACTIVE_PHASES: ReadonlySet<TrailSessionPhase> = new Set(['approaching', 'tracking'])

export function useTrailNavigationSession({ stopGps, now = Date.now }: Options) {
  const [phase, setPhaseState] = useState<TrailSessionPhase>('idle')
  const phaseRef = useRef<TrailSessionPhase>('idle')
  const [gpsHealth, setGpsHealth] = useState<TrailGpsHealth>('inactive')
  const [gpsActive, setGpsActive] = useState(false)
  const [latestPoint, setLatestPoint] = useState<TrailSessionPoint | null>(null)
  const latestPointRef = useRef<TrailSessionPoint | null>(null)
  const [distanceToTrailM, setDistanceToTrailM] = useState<number | null>(null)
  const distanceToTrailRef = useRef<number | null>(null)
  const [points, setPoints] = useState<TrailSessionPoint[]>([])
  const pointsRef = useRef<TrailSessionPoint[]>([])
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const [summary, setSummary] = useState<TrailSessionSummary | null>(null)
  const [clockMs, setClockMs] = useState(now())
  const [isOffTrack, setIsOffTrack] = useState(false)
  const physicallyReachedRef = useRef(false)

  const setPhase = useCallback((next: TrailSessionPhase) => {
    phaseRef.current = next
    setPhaseState(next)
  }, [])

  const refreshClock = useCallback(() => setClockMs(now()), [now])

  useEffect(() => {
    if (!gpsActive || phase === 'stopped') return
    const intervalId = window.setInterval(refreshClock, 1_000)
    return () => window.clearInterval(intervalId)
  }, [gpsActive, phase, refreshClock])

  const markGpsPrompting = useCallback(() => {
    setGpsActive(true)
    setGpsHealth('prompting')
  }, [])

  const markGpsDenied = useCallback(() => {
    setGpsHealth('denied')
  }, [])

  const markGpsUnavailable = useCallback(() => {
    setGpsHealth('unavailable')
  }, [])

  const receiveGpsPosition = useCallback((position: GeolocationPosition, distanceM: number) => {
    if (phaseRef.current === 'stopped') return
    const point = toTrailSessionPoint(position)
    latestPointRef.current = point
    distanceToTrailRef.current = distanceM
    setLatestPoint(point)
    setDistanceToTrailM(distanceM)
    setClockMs(now())

    if (point.accuracy > SESSION_START_MAX_ACCURACY_M) {
      setGpsHealth('low_accuracy')
      return
    }
    setGpsHealth('good')

    if (!ACTIVE_PHASES.has(phaseRef.current)) {
      setPhase(distanceM <= SESSION_START_MAX_DISTANCE_M ? 'ready_to_join' : 'pre_start')
      return
    }

    const last = pointsRef.current.at(-1) ?? null
    if (shouldAcceptTrackPoint({
      last,
      lastAcceptedAtMs: last?.timestampMs ?? null,
      next: point,
      accuracy: point.accuracy,
      nowMs: point.timestampMs,
    })) {
      pointsRef.current = [...pointsRef.current, point]
      setPoints(pointsRef.current)
    }

    if (distanceM <= SESSION_TRACKING_DISTANCE_M) {
      physicallyReachedRef.current = true
      setIsOffTrack(false)
      setPhase('tracking')
      return
    }
    if (physicallyReachedRef.current) setIsOffTrack(true)
  }, [now, setPhase])

  const canStart = isTrailSessionStartEligible({
    gpsActive,
    point: latestPoint,
    distanceToTrailM,
    nowMs: clockMs,
  })

  const startSession = useCallback((): boolean => {
    const startPoint = latestPointRef.current
    const currentDistanceM = distanceToTrailRef.current
    const startedAt = now()
    if (!isTrailSessionStartEligible({
      gpsActive,
      point: startPoint,
      distanceToTrailM: currentDistanceM,
      nowMs: startedAt,
    }) || startPoint === null || currentDistanceM === null) return false

    const normalizedStart = { ...startPoint, timestampMs: startedAt }
    pointsRef.current = [normalizedStart]
    setPoints(pointsRef.current)
    startedAtRef.current = startedAt
    setStartedAtMs(startedAt)
    setSummary(null)
    physicallyReachedRef.current = currentDistanceM <= SESSION_TRACKING_DISTANCE_M
    setIsOffTrack(false)
    setPhase(physicallyReachedRef.current ? 'tracking' : 'approaching')
    return true
  }, [gpsActive, now, setPhase])

  const stopSession = useCallback((): TrailSessionSummary | null => {
    if (!ACTIVE_PHASES.has(phaseRef.current) || startedAtRef.current === null) return summary
    const stoppedAtMs = now()
    const frozen = buildSessionSummary({
      points: pointsRef.current,
      startedAtMs: startedAtRef.current,
      stoppedAtMs,
    })
    setPhase('stopped')
    setSummary(frozen)
    stopGps()
    return frozen
  }, [now, setPhase, stopGps, summary])

  const isActive = ACTIVE_PHASES.has(phase)
  const distanceM = useMemo(() => calculateSessionDistance(points), [points])
  const elapsedSeconds = summary
    ? summary.durationSeconds
    : startedAtMs === null
      ? null
      : Math.max(0, (clockMs - startedAtMs) / 1_000)

  const effectiveGpsHealth: TrailGpsHealth = (
    gpsHealth === 'good' &&
    latestPoint !== null &&
    clockMs - latestPoint.timestampMs > SESSION_START_MAX_AGE_MS
  ) ? 'low_accuracy' : gpsHealth

  return {
    phase,
    gpsHealth: effectiveGpsHealth,
    latestPoint,
    distanceToTrailM,
    points,
    summary,
    canStart,
    isActive,
    isOffTrack,
    distanceM,
    elapsedSeconds,
    markGpsPrompting,
    markGpsDenied,
    markGpsUnavailable,
    receiveGpsPosition,
    startSession,
    stopSession,
    refreshClock,
  }
}
```

- [ ] **Step 4: Run hook and statistics tests**

Run:

```bash
npm test -- tests/unit/trail-navigation.session-hook.test.tsx tests/unit/trail-navigation.session-stats.test.ts --runInBand
```

Expected: PASS.

- [ ] **Step 5: Commit the session hook**

```bash
git add src/features/trail-navigation/hooks/useTrailNavigationSession.ts tests/unit/trail-navigation.session-hook.test.tsx
git commit -m "feat: add local trail session hook"
```

## Task 3: Add the conditional summary modal

**Files:**
- Create: `src/features/trail-navigation/components/TrailSessionSummaryModal.tsx`
- Create: `tests/unit/trail-navigation.session-summary-modal.test.tsx`

- [ ] **Step 1: Write failing modal tests**

Create `tests/unit/trail-navigation.session-summary-modal.test.tsx`:

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TrailSessionSummaryModal } from '@/features/trail-navigation/components/TrailSessionSummaryModal'

describe('TrailSessionSummaryModal', () => {
  it('AC-05-09: shows frozen distance and duration but hides unavailable elevation and steps', () => {
    render(
      <TrailSessionSummaryModal
        summary={{ distanceM: 1_245, durationSeconds: 3_661, elevationGainM: null }}
        onViewTrail={jest.fn()}
        exitHref="/guide/megeve/rando/mont-joux"
      />,
    )
    expect(screen.getByRole('dialog', { name: /randonnée terminée/i })).toBeInTheDocument()
    expect(screen.getByText('1,25 km')).toBeInTheDocument()
    expect(screen.getByText('1 h 01 min')).toBeInTheDocument()
    expect(screen.queryByText(/dénivelé/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/pas/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/n\/a/i)).not.toBeInTheDocument()
  })

  it('shows reliable elevation and exposes both end actions', async () => {
    const onViewTrail = jest.fn()
    render(
      <TrailSessionSummaryModal
        summary={{ distanceM: 900, durationSeconds: 600, elevationGainM: 42 }}
        onViewTrail={onViewTrail}
        exitHref="/guide/megeve/rando/mont-joux"
      />,
    )
    expect(screen.getByText('42 m')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /voir le tracé/i }))
    expect(onViewTrail).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('link', { name: /quitter la rando/i })).toHaveAttribute(
      'href',
      '/guide/megeve/rando/mont-joux',
    )
  })
})
```

- [ ] **Step 2: Run the modal test and verify it fails**

Run:

```bash
npm test -- tests/unit/trail-navigation.session-summary-modal.test.tsx --runInBand
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the accessible modal**

Create `src/features/trail-navigation/components/TrailSessionSummaryModal.tsx`:

```tsx
'use client'

import { Flag, Mountain, Route, Timer } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { TrailSessionSummary } from '../types'

type Props = {
  summary: TrailSessionSummary
  onViewTrail: () => void
  exitHref?: string
  onExit?: () => void
}

export function TrailSessionSummaryModal({ summary, onViewTrail, exitHref, onExit }: Props) {
  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/45 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="trail-summary-title"
        className="w-full rounded-[2rem] bg-[#FAF9F6] p-6 shadow-2xl"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#455E4C] text-white">
          <Flag className="h-5 w-5" />
        </div>
        <h2 id="trail-summary-title" className="mt-4 text-center font-serif text-2xl italic text-charcoal">
          Randonnée terminée
        </h2>
        <div className={`mt-6 grid gap-3 ${summary.elevationGainM === null ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <SummaryMetric icon={<Route className="h-4 w-4" />} label="Distance parcourue" value={formatDistance(summary.distanceM)} />
          <SummaryMetric icon={<Timer className="h-4 w-4" />} label="Durée" value={formatDuration(summary.durationSeconds)} />
          {summary.elevationGainM !== null && (
            <SummaryMetric icon={<Mountain className="h-4 w-4" />} label="Dénivelé positif" value={`${summary.elevationGainM} m`} />
          )}
        </div>
        <button type="button" onClick={onViewTrail} className="mt-6 w-full rounded-full bg-[#455E4C] px-4 py-3 text-xs font-bold uppercase tracking-widest text-white">
          Voir le tracé
        </button>
        {onExit ? (
          <button type="button" onClick={onExit} className="mt-3 w-full text-xs font-bold uppercase tracking-widest text-charcoal/60">
            Quitter la rando
          </button>
        ) : (
          <Link href={exitHref ?? '/'} className="mt-3 block w-full text-center text-xs font-bold uppercase tracking-widest text-charcoal/60">
            Quitter la rando
          </Link>
        )}
      </section>
    </div>
  )
}

function SummaryMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-4 text-center shadow-sm">
      <span className="mx-auto flex w-fit text-[#455E4C]">{icon}</span>
      <p className="mt-2 text-sm font-semibold text-charcoal">{value}</p>
      <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-charcoal/40">{label}</p>
    </div>
  )
}

function formatDistance(distanceM: number): string {
  if (distanceM < 1_000) return `${Math.round(distanceM)} m`
  return `${(distanceM / 1_000).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km`
}

function formatDuration(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60)
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  return `${hours} h ${String(totalMinutes % 60).padStart(2, '0')} min`
}
```

- [ ] **Step 4: Run the modal tests**

Run:

```bash
npm test -- tests/unit/trail-navigation.session-summary-modal.test.tsx --runInBand
```

Expected: PASS.

- [ ] **Step 5: Commit the modal**

```bash
git add src/features/trail-navigation/components/TrailSessionSummaryModal.tsx tests/unit/trail-navigation.session-summary-modal.test.tsx
git commit -m "feat: add trail session summary modal"
```

## Task 4: Integrate 1,500 m entry and privacy-safe approach into the map

**Files:**
- Modify: `src/features/trail-navigation/components/TrailNavigationMap.tsx`
- Modify: `src/features/trail-navigation/lib/geo.ts`
- Modify: `tests/unit/trail-navigation.geo.test.ts`
- Modify: `tests/unit/trail-navigation.start-map.test.tsx`
- Delete: `src/app/api/trails/walking-route/route.ts`

- [ ] **Step 1: Update the failing map tests for the new contract**

In `tests/unit/trail-navigation.start-map.test.tsx`, add this helper and replace historical fixtures using `timestamp: 1` so they remain recent:

```tsx
function makePosition({
  latitude = 45.8732,
  longitude = 6.6731,
  accuracy = 8,
  timestamp = Date.now(),
  altitude = null,
  altitudeAccuracy = null,
}: Partial<{
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
  altitude: number | null
  altitudeAccuracy: number | null
}> = {}): GeolocationPosition {
  return {
    coords: { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading: null, speed: null },
    timestamp,
  }
}
```

Replace the old test that expected the approach line to disappear immediately with:

```tsx
it('AC-05-04/06: keeps the approach line after start and removes it only when the trail is reached', async () => {
  let gpsSuccess: PositionCallback | null = null
  const watchPosition = jest.fn((success: PositionCallback) => {
    gpsSuccess = success
    return 42
  })
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { watchPosition, clearWatch: jest.fn() },
  })

  render(<TrailNavigationMap trail={trail} />)
  await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))
  act(() => gpsSuccess?.(makePosition({ latitude: 45.8745, longitude: 6.673, accuracy: 8 })))
  await userEvent.click(await screen.findByRole('button', { name: /^démarrer ici$/i }))
  expect(screen.getByTestId('map-layer-approach-line-layer')).toBeInTheDocument()

  act(() => gpsSuccess?.(makePosition({ latitude: 45.8732, longitude: 6.6731, accuracy: 8, timestamp: Date.now() + 4_000 })))
  await waitFor(() => expect(screen.queryByTestId('map-layer-approach-line-layer')).not.toBeInTheDocument())
})
```

Add these focused assertions:

```tsx
it('AC-05-01/02: never offers Démarrer ici before GPS and offers it near a middle segment', async () => {
  let gpsSuccess: PositionCallback | null = null
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { watchPosition: jest.fn((success: PositionCallback) => { gpsSuccess = success; return 12 }), clearWatch: jest.fn() },
  })
  render(<TrailNavigationMap trail={trail} />)
  expect(screen.queryByRole('button', { name: /^démarrer ici$/i })).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))
  act(() => gpsSuccess?.(makePosition({ latitude: 45.878, longitude: 6.681, accuracy: 8 })))
  expect(await screen.findByRole('button', { name: /^démarrer ici$/i })).toBeInTheDocument()
})

it('BR-28: does not send the GPS position to a walking-route API', async () => {
  const fetchSpy = jest.spyOn(global, 'fetch')
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { watchPosition: jest.fn((success: PositionCallback) => { success(makePosition()); return 12 }), clearWatch: jest.fn() },
  })
  render(<TrailNavigationMap trail={trail} />)
  await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))
  expect(fetchSpy).not.toHaveBeenCalledWith('/api/trails/walking-route', expect.anything())
})
```

- [ ] **Step 2: Run the map tests and verify the old behavior fails**

Run:

```bash
npm test -- tests/unit/trail-navigation.start-map.test.tsx --runInBand
```

Expected: FAIL because the button still says `Démarrer depuis ici`, the threshold is capped at 500 m, and the approach line disappears immediately.

- [ ] **Step 3: Replace the single GPS-state union with phase plus health**

In `src/features/trail-navigation/lib/geo.ts`, remove `TrailGpsState` and change camera following to use `TrailSessionPhase`:

```ts
import type { TrailCoordinate, TrailGeometry, TrailLineString, TrailMultiLineString, TrailSessionPhase } from '../types'

const CAMERA_FOLLOW_PHASES: ReadonlySet<TrailSessionPhase> = new Set(['approaching', 'tracking'])

export function shouldAutoFollowCamera(
  phase: TrailSessionPhase,
  isFollowing: boolean,
): boolean {
  return isFollowing && CAMERA_FOLLOW_PHASES.has(phase)
}
```

Replace the `shouldAutoFollowCamera` suite in `tests/unit/trail-navigation.geo.test.ts` with:

```ts
describe('shouldAutoFollowCamera', () => {
  it('follows only during an active session when following is enabled', () => {
    expect(shouldAutoFollowCamera('approaching', true)).toBe(true)
    expect(shouldAutoFollowCamera('tracking', true)).toBe(true)
    expect(shouldAutoFollowCamera('approaching', false)).toBe(false)
    expect(shouldAutoFollowCamera('tracking', false)).toBe(false)
  })

  it.each(['idle', 'pre_start', 'ready_to_join', 'stopped'] as const)(
    'never follows during %s',
    phase => expect(shouldAutoFollowCamera(phase, true)).toBe(false),
  )
})
```

- [ ] **Step 4: Wire the session hook into `TrailNavigationMap`**

Add imports:

```ts
import { Square } from 'lucide-react'
import { useCallback } from 'react'
import { useTrailNavigationSession } from '../hooks/useTrailNavigationSession'
import { SESSION_START_MAX_DISTANCE_M } from '../lib/session-stats'
import { TrailSessionSummaryModal } from './TrailSessionSummaryModal'
```

Replace `JOIN_TOLERANCE_M`, `gpsState`, `hasIntentToJoinRef`, pre-start breadcrumb refs and the old tracking timer with:

```ts
const [isSummaryOpen, setIsSummaryOpen] = useState(false)

const stopGpsTracking = useCallback(() => {
  if (watchIdRef.current === null || !('geolocation' in navigator)) return
  navigator.geolocation.clearWatch(watchIdRef.current)
  watchIdRef.current = null
}, [])

const session = useTrailNavigationSession({ stopGps: stopGpsTracking })
```

The `watchPosition` callback must calculate distance locally and forward the raw browser position once:

```ts
const current = {
  latitude: nextPosition.coords.latitude,
  longitude: nextPosition.coords.longitude,
}
setPosition(current)
setAccuracy(nextPosition.coords.accuracy)
const nextDistanceToTrailM = getTrailDistanceMeters(current, geometry)
session.receiveGpsPosition(nextPosition, nextDistanceToTrailM)
```

Before calling `watchPosition`, call `session.markGpsPrompting()`. Map permission denial to `session.markGpsDenied()` and later acquisition errors during an active session to `session.markGpsUnavailable()`.

Use this error callback:

```ts
error => {
  if (error.code === error.PERMISSION_DENIED) {
    session.markGpsDenied()
    return
  }
  session.markGpsUnavailable()
}
```

Replace the unmount cleanup with:

```ts
useEffect(() => stopGpsTracking, [stopGpsTracking])
```

The start button must call `session.startSession()` and use the exact label `Démarrer ici`. Remove the environment-driven clamp and display `SESSION_START_MAX_DISTANCE_M` in the pre-start message.

Apply these exact render conditions while replacing the former `gpsState` comparisons:

```ts
const showActivateGps = session.gpsHealth === 'inactive'
const showStartHere = session.phase === 'ready_to_join' && session.canStart
const showPreStart = session.phase === 'pre_start'
const showApproaching = session.phase === 'approaching'
const showOffTrack = session.isOffTrack
const showLowAccuracy = session.gpsHealth === 'low_accuracy'
```

Use the booleans for the corresponding JSX blocks. The Stop control depends only on `session.isActive`, never on GPS health.

Make `recenterOnPosition` a no-op when no fix exists so it does not activate GPS implicitly:

```ts
function recenterOnPosition() {
  if (!position) return
  setIsFollowing(true)
  mapRef.current?.flyTo({
    center: [position.longitude, position.latitude],
    zoom: 17.5,
    pitch: 55,
    duration: 800,
    essential: true,
  })
}
```

Replace camera and track derivations with:

```ts
useEffect(() => {
  if (!position || !shouldAutoFollowCamera(session.phase, isFollowing)) return
  mapRef.current?.getMap()?.easeTo({
    center: [position.longitude, position.latitude],
    duration: 700,
    essential: true,
  })
}, [isFollowing, position, session.phase])

const userTrackLine = useMemo(() => {
  if (session.points.length < 2) return null
  const coordinates = session.points.map(point => [point.longitude, point.latitude] as [number, number])
  return {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'LineString' as const, coordinates: smoothTrack(coordinates) },
  }
}, [session.points])

const markerColor = session.isOffTrack
  ? '#DC2626'
  : session.phase === 'tracking'
    ? '#16A34A'
    : session.phase === 'approaching'
      ? '#F59E0B'
      : '#2563EB'
```

Replace the old `gpsHealthColor` and `gpsStateLabel` helpers with:

```ts
function gpsHealthColor(health: TrailGpsHealth): string {
  if (health === 'denied' || health === 'unavailable') return '#DC2626'
  if (health === 'inactive' || health === 'prompting' || health === 'low_accuracy') return '#F59E0B'
  return '#16A34A'
}

function sessionPhaseLabel(phase: TrailSessionPhase): string {
  if (phase === 'ready_to_join') return 'Prêt à démarrer'
  if (phase === 'approaching') return 'Approche du tracé'
  if (phase === 'tracking') return 'GPS actif'
  if (phase === 'pre_start') return 'Trop loin du tracé'
  if (phase === 'stopped') return 'Session arrêtée'
  return 'Prêt'
}
```

Import `TrailGpsHealth` and `TrailSessionPhase` from `../types` and use `gpsHealthColor(session.gpsHealth)` plus `sessionPhaseLabel(session.phase)` throughout the HUD and expanded panel.

- [ ] **Step 5: Keep the local approach target through `approaching` and remove network routing**

Derive the approach target only from the geometry:

```ts
const approachTarget = useMemo(() => {
  if (!position || !geometry) return null
  if (!['ready_to_join', 'pre_start', 'approaching'].includes(session.phase)) return null
  return getClosestPointOnTrail(position, geometry)
}, [geometry, position, session.phase])
```

Keep the existing straight `approachLine` source while `approachTarget` exists by changing the opening condition from `{approachLine && !walkingRoute && (` to `{approachLine && (`. Leave the existing `Source` and its two `Layer` children unchanged. Delete from `TrailNavigationMap.tsx`:

- `walkingRoute` state;
- `lastFetchPositionRef`;
- the effect posting `from` and `to` coordinates;
- both `walking-route` Mapbox layers;
- the walking-route distance text.

Delete `src/app/api/trails/walking-route/route.ts`. Keep `fetchOrsWalkingRoute` in the acquisition bounded context because this task does not change admin trail acquisition.

- [ ] **Step 6: Run geo and map tests**

Run:

```bash
npm test -- tests/unit/trail-navigation.geo.test.ts tests/unit/trail-navigation.start-map.test.tsx --runInBand
```

Expected: PASS.

- [ ] **Step 7: Commit entry and privacy changes**

```bash
git add src/features/trail-navigation/components/TrailNavigationMap.tsx src/features/trail-navigation/lib/geo.ts tests/unit/trail-navigation.geo.test.ts tests/unit/trail-navigation.start-map.test.tsx src/app/api/trails/walking-route/route.ts
git commit -m "feat: allow local trail entry within 1500m"
```

## Task 5: Show live session metrics, Stop, and the frozen summary

**Files:**
- Modify: `src/features/trail-navigation/components/TrailNavigationMap.tsx`
- Modify: `src/features/trail-navigation/components/NavigationHud.tsx`
- Modify: `tests/unit/trail-navigation.start-map.test.tsx`
- Create: `tests/integration/trail-navigation.session-flow.test.tsx`

- [ ] **Step 1: Write failing integration coverage for the complete flow**

Create `tests/integration/trail-navigation.session-flow.test.tsx` with this complete Mapbox fixture before the test:

```tsx
/**
 * @jest-environment jsdom
 */
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode, Ref } from 'react'
import { TrailNavigationMap } from '@/features/trail-navigation/components/TrailNavigationMap'

jest.mock('react-map-gl/mapbox', () => ({
  __esModule: true,
  default: jest.requireActual('react').forwardRef(
    ({ children }: { children: ReactNode }, ref: Ref<unknown>) => {
      const React = jest.requireActual('react') as typeof import('react')
      React.useImperativeHandle(ref, () => ({
        getMap: () => ({
          easeTo: jest.fn(),
          dragRotate: { disable: jest.fn(), enable: jest.fn() },
          touchZoomRotate: { disableRotation: jest.fn(), enableRotation: jest.fn() },
        }),
        flyTo: jest.fn(),
      }))
      return <div data-testid="mapbox-outdoors">{children}</div>
    },
  ),
  Source: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Layer: ({ id }: { id: string }) => <div data-testid={`map-layer-${id}`} />,
  Marker: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  NavigationControl: () => null,
}))

const trail = {
  id: 'poi-1',
  slug: 'mont-joux',
  name: 'Mont Joux',
  description: 'Panorama familial.',
  start_label: 'Départ Mont Joux',
  start_latitude: 45.8731,
  start_longitude: 6.673,
  geometry_geojson: { type: 'LineString', coordinates: [[6.673, 45.8731], [6.681, 45.878]] },
  difficulty: 'easy' as const,
  distance_km: 2.7,
  elevation_gain_m: 166,
  estimated_duration_min: 60,
  data_quality_status: 'complete',
  source_refs: [],
}

function makePosition({
  latitude = 45.8732,
  longitude = 6.6731,
  accuracy = 8,
  timestamp = Date.now(),
}: Partial<{ latitude: number; longitude: number; accuracy: number; timestamp: number }> = {}): GeolocationPosition {
  return {
    coords: { latitude, longitude, accuracy, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
    timestamp,
  }
}
```

Then cover the public behavior:

```tsx
it('AC-05-07/08/09/10/11: keeps Stop available, freezes the session and renders only available metrics', async () => {
  let gpsSuccess: PositionCallback | null = null
  let gpsError: PositionErrorCallback | null = null
  const clearWatch = jest.fn()
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      watchPosition: jest.fn((success: PositionCallback, error: PositionErrorCallback) => {
        gpsSuccess = success
        gpsError = error
        return 88
      }),
      clearWatch,
    },
  })

  render(<TrailNavigationMap trail={trail} backHref="/guide/megeve/rando/mont-joux" />)
  await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))
  act(() => gpsSuccess?.(makePosition({ timestamp: Date.now() })))
  await userEvent.click(await screen.findByRole('button', { name: /^démarrer ici$/i }))
  expect(screen.getByRole('button', { name: /^stop$/i })).toBeInTheDocument()

  act(() => gpsError?.({ code: 2, message: 'lost', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }))
  expect(screen.getByRole('button', { name: /^stop$/i })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /^stop$/i }))

  expect(clearWatch).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('dialog', { name: /randonnée terminée/i })).toBeInTheDocument()
  expect(screen.getByText(/distance parcourue/i)).toBeInTheDocument()
  expect(screen.getByText(/durée/i)).toBeInTheDocument()
  expect(screen.queryByText(/pas/i)).not.toBeInTheDocument()
  expect(screen.queryByText(/n\/a/i)).not.toBeInTheDocument()
})
```

Add this second integration test to prove arrival never stops automatically:

```tsx
it('AC-05-11: reaching the official end keeps the session active until Stop', async () => {
  let gpsSuccess: PositionCallback | null = null
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      watchPosition: jest.fn((success: PositionCallback) => { gpsSuccess = success; return 89 }),
      clearWatch: jest.fn(),
    },
  })
  render(<TrailNavigationMap trail={trail} />)
  await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))
  act(() => gpsSuccess?.(makePosition()))
  await userEvent.click(await screen.findByRole('button', { name: /^démarrer ici$/i }))
  act(() => gpsSuccess?.(makePosition({ latitude: 45.878, longitude: 6.681, timestamp: Date.now() + 4_000 })))
  expect(screen.getByRole('button', { name: /^stop$/i })).toBeInTheDocument()
  expect(screen.queryByRole('dialog', { name: /randonnée terminée/i })).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run the integration test and verify Stop is missing**

Run:

```bash
npm test -- tests/integration/trail-navigation.session-flow.test.tsx --runInBand
```

Expected: FAIL because the persistent Stop control and summary integration do not exist.

- [ ] **Step 3: Make `NavigationHud` display session distance instead of official progress**

Change its props to:

```ts
type Props = {
  statusColor: string
  healthColor: string
  statusLabel: string
  distanceKm: number | null
  entryProgressPercent: number | null
  elapsedSeconds: number | null
  pulse: boolean
  onExpand: () => void
}
```

Render `distanceKm` with the `km` suffix. Render `entryProgressPercent` only before the session starts. In `TrailNavigationMap`, pass:

```tsx
distanceKm={session.isActive || session.phase === 'stopped' ? session.distanceM / 1_000 : trail.distance_km}
entryProgressPercent={session.phase === 'ready_to_join' && progress ? progress.percent : null}
elapsedSeconds={session.elapsedSeconds}
```

Replace the unconditional HUD progress bar with:

```tsx
{entryProgressPercent !== null && (
  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-charcoal/10">
    <div
      className="h-full transition-all duration-500 ease-out"
      style={{
        width: `${Math.min(100, Math.max(0, entryProgressPercent))}%`,
        backgroundColor: statusColor,
      }}
    />
  </div>
)}
```

Remove the text `m parcourus estimés` from the pre-start entry message. Keep only:

```tsx
Point d&apos;entrée estimé : <strong>{Math.round(progress.percent)}%</strong> du parcours.
```

- [ ] **Step 4: Add the persistent Stop control and summary modal**

In the top-left map action, render Stop instead of Close while `session.isActive`:

Define the existing close control before `return`:

```tsx
const closeControl = onClose ? (
  <button type="button" onClick={onClose} aria-label="Fermer" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-charcoal shadow">
    <X className="h-5 w-5" />
  </button>
) : (
  <Link href={backHref} aria-label="Fermer" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-charcoal shadow">
    <X className="h-5 w-5" />
  </Link>
)
```

```tsx
{session.isActive ? (
  <button
    type="button"
    onClick={() => {
      session.stopSession()
      setIsSummaryOpen(true)
    }}
    className="flex h-11 items-center gap-2 rounded-full bg-red-600 px-4 text-xs font-bold uppercase tracking-widest text-white shadow"
    aria-label="Stop"
  >
    <Square className="h-4 w-4 fill-current" />
    Stop
  </button>
) : closeControl}
```

At the end of `<main>`, render:

```tsx
{isSummaryOpen && session.summary && (
  <TrailSessionSummaryModal
    summary={session.summary}
    onViewTrail={() => setIsSummaryOpen(false)}
    {...(onClose ? { onExit: onClose } : { exitHref: backHref })}
  />
)}
```

- [ ] **Step 5: Replace theoretical expanded metrics after session start**

Derive the displayed metric list in `TrailNavigationMap`:

```ts
const displayedDistance = session.isActive || session.phase === 'stopped'
  ? `${(session.distanceM / 1_000).toFixed(2)} km`
  : trail.distance_km
    ? `${trail.distance_km.toFixed(1)} km`
    : 'n/a'

const displayedDuration = session.elapsedSeconds !== null
  ? formatElapsedSeconds(session.elapsedSeconds)
  : formatDuration(trail.estimated_duration_min)
```

Add this formatter next to the existing `formatDuration`:

```ts
function formatElapsedSeconds(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60)
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  return `${hours} h ${String(totalMinutes % 60).padStart(2, '0')} min`
}
```

Use `displayedDistance` and `displayedDuration` in the expanded panel. Render the third metric exactly as:

```tsx
{!session.isActive && session.phase !== 'stopped' && (
  <Metric label="D+" value={trail.elevation_gain_m ? `${trail.elevation_gain_m} m` : 'n/a'} />
)}
```

Change the metric grid class to:

```tsx
className={`mt-4 grid gap-2 text-center text-xs ${session.isActive || session.phase === 'stopped' ? 'grid-cols-2' : 'grid-cols-3'}`}
```

- [ ] **Step 6: Run unit and integration navigation tests**

Run:

```bash
npm test -- tests/unit/trail-navigation.start-map.test.tsx tests/unit/trail-navigation.session-summary-modal.test.tsx tests/integration/trail-navigation.session-flow.test.tsx --runInBand
```

Expected: PASS.

- [ ] **Step 7: Commit the end-to-end session UI**

```bash
git add src/features/trail-navigation/components/TrailNavigationMap.tsx src/features/trail-navigation/components/NavigationHud.tsx tests/unit/trail-navigation.start-map.test.tsx tests/integration/trail-navigation.session-flow.test.tsx
git commit -m "feat: stop trail sessions with local summary"
```

## Task 6: Update traceability and verify the complete feature

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Update the 021 traceability rows**

Under `## 021 — Trail Navigation`, replace the former combined progression row and append rows with these exact mappings:

```markdown
| AC-05-01/AC-05-02/AC-05-03/BR-20/BR-21 | GPS actif, fix récent/précis et seuil inclusif de 1 500 m depuis le point le plus proche de tout le tracé | `src/features/trail-navigation/lib/session-stats.ts`<br>`src/features/trail-navigation/hooks/useTrailNavigationSession.ts`<br>`src/features/trail-navigation/components/TrailNavigationMap.tsx` | `tests/unit/trail-navigation.session-stats.test.ts`<br>`tests/unit/trail-navigation.session-hook.test.tsx`<br>`tests/unit/trail-navigation.start-map.test.tsx` | ✅ done |
| AC-05-04/AC-05-05/AC-05-06/BR-22/BR-23/BR-24 | Départ réel figé au clic, remise à zéro, approche comptabilisée et passage à `tracking` à 35 m | `src/features/trail-navigation/lib/session-stats.ts`<br>`src/features/trail-navigation/hooks/useTrailNavigationSession.ts`<br>`src/features/trail-navigation/components/TrailNavigationMap.tsx` | `tests/unit/trail-navigation.session-stats.test.ts`<br>`tests/unit/trail-navigation.session-hook.test.tsx`<br>`tests/unit/trail-navigation.start-map.test.tsx` | ✅ done |
| AC-05-07/AC-05-08/AC-05-10/AC-05-11/BR-25/BR-27 | Stop permanent et idempotent, statistiques figées, perte GPS tolérée et aucune fin automatique | `src/features/trail-navigation/hooks/useTrailNavigationSession.ts`<br>`src/features/trail-navigation/components/TrailNavigationMap.tsx` | `tests/unit/trail-navigation.session-hook.test.tsx`<br>`tests/integration/trail-navigation.session-flow.test.tsx` | ✅ done |
| AC-05-09/BR-26 | Récapitulatif local avec distance, durée, dénivelé fiable optionnel et métriques indisponibles masquées | `src/features/trail-navigation/lib/session-stats.ts`<br>`src/features/trail-navigation/components/TrailSessionSummaryModal.tsx` | `tests/unit/trail-navigation.session-stats.test.ts`<br>`tests/unit/trail-navigation.session-summary-modal.test.tsx`<br>`tests/integration/trail-navigation.session-flow.test.tsx` | ✅ done |
| BR-28 | Trace GPS en mémoire uniquement, sans route API ni envoi de coordonnées | `src/features/trail-navigation/hooks/useTrailNavigationSession.ts`<br>`src/features/trail-navigation/components/TrailNavigationMap.tsx` | `tests/unit/trail-navigation.start-map.test.tsx` | ✅ done |
```

- [ ] **Step 2: Run all trail-navigation tests**

Run:

```bash
npm test -- tests/unit/trail-navigation.actions.test.tsx tests/unit/trail-navigation.geo.test.ts tests/unit/trail-navigation.session-stats.test.ts tests/unit/trail-navigation.session-hook.test.tsx tests/unit/trail-navigation.session-summary-modal.test.tsx tests/unit/trail-navigation.start-map.test.tsx tests/integration/trail-navigation.public-detail.test.tsx tests/integration/trail-navigation.session-flow.test.tsx --runInBand
```

Expected: PASS, 8 suites.

- [ ] **Step 3: Run the full unit and integration suite**

Run:

```bash
npm test -- --runInBand
```

Expected: PASS with no failed Jest suite.

- [ ] **Step 4: Run strict TypeScript validation**

Run:

```bash
npx tsc --noEmit
```

Expected: exit code 0 with no TypeScript diagnostic.

- [ ] **Step 5: Run the production build**

Run:

```bash
npm run build
```

Expected: Prisma generation and Next.js production build both complete successfully.

- [ ] **Step 6: Confirm no GPS trace leaves the browser**

Run:

```bash
rg -n "walking-route|fetch\(" src/features/trail-navigation src/app/api/trails
```

Expected: no `walking-route` route and no fetch of Tourist coordinates from `trail-navigation`.

- [ ] **Step 7: Commit traceability after all verification passes**

```bash
git add docs/traceability-matrix.md
git commit -m "docs: trace trail session entry and summary"
```

## Final implementation audit

- [ ] Confirm every `AC-05-01` through `AC-05-11` has a passing test named in the traceability matrix.
- [ ] Confirm `TrailNavigationMap` never starts `watchPosition` before the explicit GPS action.
- [ ] Confirm `Démarrer ici` never activates GPS implicitly.
- [ ] Confirm `Stop` remains visible when GPS health is `low_accuracy` or `unavailable`.
- [ ] Confirm closing or unmounting the mode clears any remaining watch without creating a summary.
- [ ] Confirm unrelated dirty files under `guide-customization` were neither staged nor modified.
