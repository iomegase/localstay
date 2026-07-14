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
  if (!Number.isFinite(point.accuracy) || point.accuracy < 0) return false
  if (!Number.isFinite(distanceToTrailM) || distanceToTrailM < 0) return false
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
    altitudeAccuracy: typeof altitudeAccuracy === 'number' &&
      Number.isFinite(altitudeAccuracy) &&
      altitudeAccuracy >= 0
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
      Number.isFinite(point.altitude) &&
      point.altitudeAccuracy !== null &&
      Number.isFinite(point.altitudeAccuracy) &&
      point.altitudeAccuracy >= 0 &&
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
