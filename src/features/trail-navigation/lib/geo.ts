import type { TrailCoordinate, TrailGeometry, TrailLineString, TrailMultiLineString, TrailSessionPhase } from '../types'

type Coordinate = [number, number]

const CAMERA_FOLLOW_PHASES: ReadonlySet<TrailSessionPhase> = new Set([
  'tracking',
  'approaching',
])

/**
 * Décide si la caméra Mapbox doit se recentrer automatiquement sur la position GPS.
 * `isFollowing` permet de forcer le suivi GPS actif sans relancer implicitement
 * la géolocalisation quand aucune position n'existe encore.
 */
export function shouldAutoFollowCamera(
  phase: TrailSessionPhase,
  isFollowing: boolean,
): boolean {
  return isFollowing && CAMERA_FOLLOW_PHASES.has(phase)
}

/** Seuils par défaut du tracé réellement parcouru (« breadcrumb » filtré, façon AllTrails). */
export interface TrackPointThresholds {
  /** Pas minimal entre deux points retenus (m). En dessous = bruit GPS. */
  minStepM: number
  /** Précision maximale acceptée (m) : on ignore les fix plus flous. */
  maxAccuracyM: number
  /** Intervalle minimal entre deux points retenus (ms) : évite les grappes à l'arrêt. */
  minIntervalMs: number
  /** Vitesse maximale plausible (m/s) : au-delà = saut GPS aberrant, on rejette. */
  maxSpeedMps: number
}

export const USER_TRACK_THRESHOLDS: TrackPointThresholds = {
  minStepM: 5,
  maxAccuracyM: 30,
  minIntervalMs: 3_000,
  maxSpeedMps: 8, // ~29 km/h : large pour une rando/trail, suffisant pour écarter les sauts
}

export interface TrackPointSample {
  /** Dernier point retenu (null si aucun). */
  last: TrailCoordinate | null
  /** Horodatage du dernier point retenu (ms, null si aucun). */
  lastAcceptedAtMs: number | null
  /** Candidat courant. */
  next: TrailCoordinate
  /** Précision rapportée par le GPS (m). */
  accuracy: number
  /** Horodatage du candidat courant (ms). */
  nowMs: number
}

/**
 * Décide si un fix GPS doit rejoindre le tracé réellement parcouru. On écarte :
 *  - les fix imprécis (accuracy au-dessus du seuil),
 *  - les points trop rapprochés dans le temps (< intervalle minimal) → grappes à l'arrêt,
 *  - les points qui n'ont pas bougé assez (< pas minimal) → bruit GPS,
 *  - les sauts à vitesse impossible (> vitesse max) → points aberrants.
 */
export function shouldAcceptTrackPoint(
  sample: TrackPointSample,
  thresholds: TrackPointThresholds = USER_TRACK_THRESHOLDS,
): boolean {
  const { last, lastAcceptedAtMs, next, accuracy, nowMs } = sample
  if (accuracy > thresholds.maxAccuracyM) return false
  if (last === null || lastAcceptedAtMs === null) return true

  const elapsedMs = nowMs - lastAcceptedAtMs
  if (elapsedMs < thresholds.minIntervalMs) return false

  const distanceM = haversineMeters(last, next)
  if (distanceM < thresholds.minStepM) return false

  const speedMps = distanceM / (elapsedMs / 1_000)
  if (speedMps > thresholds.maxSpeedMps) return false

  return true
}

/**
 * Lisse un tracé [lng, lat] par moyenne glissante centrée (fenêtre clampée aux bords).
 * Atténue le jitter GPS sans effacer la forme du parcours. Conserve le nombre de points
 * et renvoie l'entrée telle quelle en dessous de 3 points ou pour une fenêtre ≤ 1.
 */
export function smoothTrack(
  points: ReadonlyArray<[number, number]>,
  windowSize = 3,
): Array<[number, number]> {
  if (points.length < 3 || windowSize <= 1) return points.map(point => [...point] as [number, number])

  const half = Math.floor(windowSize / 2)
  return points.map((_, index) => {
    const from = Math.max(0, index - half)
    const to = Math.min(points.length - 1, index + half)
    let sumLng = 0
    let sumLat = 0
    for (let i = from; i <= to; i += 1) {
      sumLng += points[i][0]
      sumLat += points[i][1]
    }
    const count = to - from + 1
    return [sumLng / count, sumLat / count]
  })
}

export function isValidTrailGeometry(value: unknown): value is TrailGeometry {
  return isLineString(value) || isMultiLineString(value)
}

export function getLineEndpoints(geometry: TrailGeometry): { start: TrailCoordinate; end: TrailCoordinate } {
  const coordinates = flattenCoordinates(geometry)
  return {
    start: coordinateToPosition(coordinates[0]),
    end: coordinateToPosition(coordinates[coordinates.length - 1]),
  }
}

export function getClosestPointOnTrail(position: TrailCoordinate, geometry: TrailGeometry): TrailCoordinate {
  const lines = getCoordinateLines(geometry)
  let bestDistance = Number.POSITIVE_INFINITY
  let bestPoint: Coordinate = lines[0][0]

  for (const coordinates of lines) {
    for (let index = 0; index < coordinates.length - 1; index += 1) {
      const segmentStart = coordinateToPosition(coordinates[index])
      const segmentEnd = coordinateToPosition(coordinates[index + 1])
      const startPoint = toLocalPoint(segmentStart, position)
      const endPoint = toLocalPoint(segmentEnd, position)
      const projection = projectPointToSegment(toLocalPoint(position, position), startPoint, endPoint)
      const distance = distanceBetweenPoints(toLocalPoint(position, position), projection.point)

      if (distance < bestDistance) {
        bestDistance = distance
        const t = projection.t
        bestPoint = [
          segmentStart.longitude + t * (segmentEnd.longitude - segmentStart.longitude),
          segmentStart.latitude + t * (segmentEnd.latitude - segmentStart.latitude),
        ]
      }
    }
  }

  return coordinateToPosition(bestPoint)
}

export function getTrailDistanceMeters(position: TrailCoordinate, geometry: TrailGeometry): number {
  const projectedPosition = toLocalPoint(position, position)
  let min = Number.POSITIVE_INFINITY

  for (const coordinates of getCoordinateLines(geometry)) {
    for (let index = 0; index < coordinates.length - 1; index += 1) {
      const segmentStart = coordinateToPosition(coordinates[index])
      const segmentEnd = coordinateToPosition(coordinates[index + 1])
      const startPoint = toLocalPoint(segmentStart, position)
      const endPoint = toLocalPoint(segmentEnd, position)
      min = Math.min(min, distancePointToSegment(projectedPosition, startPoint, endPoint))
    }
  }

  return min
}

export function getPositionProgress(
  position: TrailCoordinate,
  geometry: TrailGeometry,
): { percent: number; distance_m: number } {
  let total = 0
  let bestDistance = Number.POSITIVE_INFINITY
  let distanceBeforeBestSegment = 0
  let distanceOnBestSegment = 0

  for (const coordinates of getCoordinateLines(geometry)) {
    for (let index = 0; index < coordinates.length - 1; index += 1) {
      const start = coordinateToPosition(coordinates[index])
      const end = coordinateToPosition(coordinates[index + 1])
      const segmentLength = haversineMeters(start, end)
      const startPoint = toLocalPoint(start, position)
      const endPoint = toLocalPoint(end, position)
      const projection = projectPointToSegment(toLocalPoint(position, position), startPoint, endPoint)
      const distance = distanceBetweenPoints(toLocalPoint(position, position), projection.point)

      if (distance < bestDistance) {
        bestDistance = distance
        distanceBeforeBestSegment = total
        distanceOnBestSegment = segmentLength * projection.t
      }

      total += segmentLength
    }
  }

  const progressed = distanceBeforeBestSegment + distanceOnBestSegment
  return {
    percent: total === 0 ? 0 : Math.max(0, Math.min(100, (progressed / total) * 100)),
    distance_m: progressed,
  }
}

function isLineString(value: unknown): value is TrailLineString {
  if (!isRecord(value) || value.type !== 'LineString') return false
  return Array.isArray(value.coordinates) && value.coordinates.length >= 2 && value.coordinates.every(isCoordinate)
}

function isMultiLineString(value: unknown): value is TrailMultiLineString {
  if (!isRecord(value) || value.type !== 'MultiLineString') return false
  return (
    Array.isArray(value.coordinates) &&
    value.coordinates.length > 0 &&
    value.coordinates.every(line => Array.isArray(line) && line.length >= 2 && line.every(isCoordinate))
  )
}

function isCoordinate(value: unknown): value is Coordinate {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === 'number' &&
    Number.isFinite(value[0]) &&
    value[0] >= -180 &&
    value[0] <= 180 &&
    typeof value[1] === 'number' &&
    Number.isFinite(value[1]) &&
    value[1] >= -90 &&
    value[1] <= 90
  )
}

function flattenCoordinates(geometry: TrailGeometry): Coordinate[] {
  return geometry.type === 'LineString' ? geometry.coordinates : geometry.coordinates.flat()
}

function getCoordinateLines(geometry: TrailGeometry): Coordinate[][] {
  return geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates
}

function coordinateToPosition(coordinate: Coordinate): TrailCoordinate {
  return { longitude: coordinate[0], latitude: coordinate[1] }
}

export function haversineMeters(from: TrailCoordinate, to: TrailCoordinate): number {
  const earthRadiusMeters = 6_371_000
  const fromLat = toRadians(from.latitude)
  const toLat = toRadians(to.latitude)
  const deltaLat = toRadians(to.latitude - from.latitude)
  const deltaLon = toRadians(to.longitude - from.longitude)
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLon / 2) ** 2
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180
}

function toLocalPoint(position: TrailCoordinate, origin: TrailCoordinate): { x: number; y: number } {
  const metersPerDegreeLat = 111_320
  const metersPerDegreeLon = 111_320 * Math.cos(toRadians(origin.latitude))
  return {
    x: (position.longitude - origin.longitude) * metersPerDegreeLon,
    y: (position.latitude - origin.latitude) * metersPerDegreeLat,
  }
}

function projectPointToSegment(
  point: { x: number; y: number },
  start: { x: number; y: number },
  end: { x: number; y: number },
): { point: { x: number; y: number }; t: number } {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return { point: start, t: 0 }

  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared))
  return { point: { x: start.x + t * dx, y: start.y + t * dy }, t }
}

function distancePointToSegment(
  point: { x: number; y: number },
  start: { x: number; y: number },
  end: { x: number; y: number },
): number {
  return distanceBetweenPoints(point, projectPointToSegment(point, start, end).point)
}

function distanceBetweenPoints(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
