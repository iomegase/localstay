import type { TrailCoordinate, TrailGeometry, TrailLineString, TrailMultiLineString } from '../types'

type Coordinate = [number, number]

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

export function getTrailDistanceMeters(position: TrailCoordinate, geometry: TrailGeometry): number {
  const coordinates = flattenCoordinates(geometry)
  const projectedPosition = toLocalPoint(position, position)
  let min = Number.POSITIVE_INFINITY

  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const segmentStart = coordinateToPosition(coordinates[index])
    const segmentEnd = coordinateToPosition(coordinates[index + 1])
    const startPoint = toLocalPoint(segmentStart, position)
    const endPoint = toLocalPoint(segmentEnd, position)
    min = Math.min(min, distancePointToSegment(projectedPosition, startPoint, endPoint))
  }

  return min
}

export function getPositionProgress(
  position: TrailCoordinate,
  geometry: TrailGeometry,
): { percent: number; distance_m: number } {
  const coordinates = flattenCoordinates(geometry)
  let total = 0
  let progressed = 0
  let bestDistance = Number.POSITIVE_INFINITY
  let distanceBeforeBestSegment = 0
  let distanceOnBestSegment = 0

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

  progressed = distanceBeforeBestSegment + distanceOnBestSegment
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

function coordinateToPosition(coordinate: Coordinate): TrailCoordinate {
  return { longitude: coordinate[0], latitude: coordinate[1] }
}

function haversineMeters(from: TrailCoordinate, to: TrailCoordinate): number {
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
