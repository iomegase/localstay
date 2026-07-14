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

const ACTIVE_PHASES: ReadonlySet<TrailSessionPhase> = new Set([
  'approaching',
  'tracking',
])

function isUsableGpsPoint(point: TrailSessionPoint): boolean {
  return (
    Number.isFinite(point.latitude) &&
    point.latitude >= -90 &&
    point.latitude <= 90 &&
    Number.isFinite(point.longitude) &&
    point.longitude >= -180 &&
    point.longitude <= 180 &&
    Number.isFinite(point.accuracy) &&
    point.accuracy >= 0 &&
    Number.isFinite(point.timestampMs) &&
    point.timestampMs >= 0
  )
}

export function useTrailNavigationSession({ stopGps, now = Date.now }: Options) {
  const nowRef = useRef(now)
  nowRef.current = now

  const [phase, setPhaseState] = useState<TrailSessionPhase>('idle')
  const phaseRef = useRef<TrailSessionPhase>('idle')
  const [gpsHealth, setGpsHealth] = useState<TrailGpsHealth>('inactive')
  const [gpsActive, setGpsActive] = useState(false)
  const gpsActiveRef = useRef(false)
  const [latestPoint, setLatestPoint] = useState<TrailSessionPoint | null>(null)
  const latestPointRef = useRef<TrailSessionPoint | null>(null)
  const [distanceToTrailM, setDistanceToTrailM] = useState<number | null>(null)
  const distanceToTrailRef = useRef<number | null>(null)
  const [points, setPoints] = useState<readonly TrailSessionPoint[]>([])
  const pointsRef = useRef<readonly TrailSessionPoint[]>([])
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const [summary, setSummary] = useState<TrailSessionSummary | null>(null)
  const summaryRef = useRef<TrailSessionSummary | null>(null)
  const [clockMs, setClockMs] = useState(() => now())
  const [isOffTrack, setIsOffTrack] = useState(false)
  const physicallyReachedRef = useRef(false)
  const stopGpsCalledRef = useRef(false)

  const setPhase = useCallback((nextPhase: TrailSessionPhase) => {
    phaseRef.current = nextPhase
    setPhaseState(nextPhase)
  }, [])

  const refreshClock = useCallback(() => {
    setClockMs(nowRef.current())
  }, [])

  useEffect(() => {
    if (!gpsActive || phase === 'stopped') return

    const interval = window.setInterval(refreshClock, 1_000)
    return () => window.clearInterval(interval)
  }, [gpsActive, phase, refreshClock])

  const markGpsPrompting = useCallback(() => {
    gpsActiveRef.current = true
    setGpsActive(true)
    setGpsHealth('prompting')
  }, [])

  const markGpsDenied = useCallback(() => {
    gpsActiveRef.current = false
    setGpsActive(false)
    setGpsHealth('denied')
  }, [])

  const markGpsUnavailable = useCallback(() => {
    setGpsHealth('unavailable')
  }, [])

  const receiveGpsPosition = useCallback((
    position: GeolocationPosition,
    nextDistanceToTrailM: number,
  ) => {
    if (phaseRef.current === 'stopped') return

    const point = toTrailSessionPoint(position)
    if (!isUsableGpsPoint(point)) return

    const receivedAtMs = nowRef.current()
    const validDistance = Number.isFinite(nextDistanceToTrailM) && nextDistanceToTrailM >= 0
      ? nextDistanceToTrailM
      : null

    latestPointRef.current = point
    setLatestPoint(point)
    distanceToTrailRef.current = validDistance
    setDistanceToTrailM(validDistance)
    setClockMs(receivedAtMs)

    if (point.accuracy > SESSION_START_MAX_ACCURACY_M) {
      setGpsHealth('low_accuracy')
      return
    }

    setGpsHealth('good')

    if (!ACTIVE_PHASES.has(phaseRef.current)) {
      setPhase(
        validDistance !== null && validDistance <= SESSION_START_MAX_DISTANCE_M
          ? 'ready_to_join'
          : 'pre_start',
      )
      return
    }

    const previousPoint = pointsRef.current.at(-1) ?? null
    if (shouldAcceptTrackPoint({
      last: previousPoint,
      lastAcceptedAtMs: previousPoint?.timestampMs ?? null,
      next: point,
      accuracy: point.accuracy,
      nowMs: point.timestampMs,
    })) {
      const nextPoints = [...pointsRef.current, point]
      pointsRef.current = nextPoints
      setPoints(nextPoints)
    }

    if (validDistance === null) return

    if (validDistance <= SESSION_TRACKING_DISTANCE_M) {
      physicallyReachedRef.current = true
      setIsOffTrack(false)
      setPhase('tracking')
    } else if (physicallyReachedRef.current) {
      setIsOffTrack(true)
    } else {
      setPhase('approaching')
    }
  }, [setPhase])

  const canStart = useMemo(() => isTrailSessionStartEligible({
    gpsActive,
    point: latestPoint,
    distanceToTrailM,
    nowMs: clockMs,
  }), [clockMs, distanceToTrailM, gpsActive, latestPoint])

  const startSession = useCallback(() => {
    if (phaseRef.current !== 'ready_to_join') return false

    const clickedAtMs = nowRef.current()
    const point = latestPointRef.current
    const eligible = isTrailSessionStartEligible({
      gpsActive: gpsActiveRef.current,
      point,
      distanceToTrailM: distanceToTrailRef.current,
      nowMs: clickedAtMs,
    })

    if (!eligible || point === null || distanceToTrailRef.current === null) return false

    const snapshot = { ...point, timestampMs: clickedAtMs }
    const nextPoints = [snapshot]
    pointsRef.current = nextPoints
    setPoints(nextPoints)
    startedAtRef.current = clickedAtMs
    setStartedAtMs(clickedAtMs)
    summaryRef.current = null
    setSummary(null)
    setIsOffTrack(false)
    stopGpsCalledRef.current = false

    const reachedTrail = distanceToTrailRef.current <= SESSION_TRACKING_DISTANCE_M
    physicallyReachedRef.current = reachedTrail
    setPhase(reachedTrail ? 'tracking' : 'approaching')
    setClockMs(clickedAtMs)
    return true
  }, [setPhase])

  const stopSession = useCallback(() => {
    if (!ACTIVE_PHASES.has(phaseRef.current) || startedAtRef.current === null) {
      return summaryRef.current
    }

    const stoppedAtMs = nowRef.current()
    const frozenSummary = buildSessionSummary({
      points: pointsRef.current,
      startedAtMs: startedAtRef.current,
      stoppedAtMs,
    })
    summaryRef.current = frozenSummary
    setSummary(frozenSummary)
    setClockMs(stoppedAtMs)
    setPhase('stopped')

    if (!stopGpsCalledRef.current) {
      stopGpsCalledRef.current = true
      stopGps()
    }

    return frozenSummary
  }, [setPhase, stopGps])

  const isActive = ACTIVE_PHASES.has(phase)
  const distanceM = useMemo(() => calculateSessionDistance(points), [points])
  const elapsedSeconds = useMemo(() => {
    if (startedAtMs === null) return null
    if (summary !== null) return summary.durationSeconds
    return Math.max(0, (clockMs - startedAtMs) / 1_000)
  }, [clockMs, startedAtMs, summary])
  const effectiveGpsHealth = useMemo<TrailGpsHealth>(() => {
    if (
      gpsHealth === 'good' &&
      latestPoint !== null &&
      clockMs - latestPoint.timestampMs > SESSION_START_MAX_AGE_MS
    ) {
      return 'low_accuracy'
    }
    return gpsHealth
  }, [clockMs, gpsHealth, latestPoint])

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
