import type { Prisma } from '@prisma/client'

type Coordinate = [number, number]

type LineStringGeometry = {
  type: 'LineString'
  coordinates: Coordinate[]
}

type MultiLineStringGeometry = {
  type: 'MultiLineString'
  coordinates: Coordinate[][]
}

export type TrailGeometryValidation =
  | { status: 'valid'; geometry: Prisma.InputJsonValue; start: { latitude: number; longitude: number } | null }
  | { status: 'invalid'; geometry: null; start: null }

export function validateTrailGeometry(input: unknown): TrailGeometryValidation {
  if (isLineString(input)) {
    return {
      status: 'valid',
      geometry: input as Prisma.InputJsonValue,
      start: startFromCoordinate(input.coordinates[0]),
    }
  }

  if (isMultiLineString(input)) {
    const firstLine = input.coordinates[0]
    return {
      status: 'valid',
      geometry: input as Prisma.InputJsonValue,
      start: firstLine ? startFromCoordinate(firstLine[0]) : null,
    }
  }

  return { status: 'invalid', geometry: null, start: null }
}

function isLineString(input: unknown): input is LineStringGeometry {
  if (!isRecord(input) || input.type !== 'LineString') return false
  return Array.isArray(input.coordinates) && input.coordinates.length >= 2 && input.coordinates.every(isCoordinate)
}

function isMultiLineString(input: unknown): input is MultiLineStringGeometry {
  if (!isRecord(input) || input.type !== 'MultiLineString') return false
  return (
    Array.isArray(input.coordinates) &&
    input.coordinates.length > 0 &&
    input.coordinates.every(line => Array.isArray(line) && line.length >= 2 && line.every(isCoordinate))
  )
}

function isCoordinate(value: unknown): value is Coordinate {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === 'number' &&
    Number.isFinite(value[0]) &&
    typeof value[1] === 'number' &&
    Number.isFinite(value[1]) &&
    value[0] >= -180 &&
    value[0] <= 180 &&
    value[1] >= -90 &&
    value[1] <= 90
  )
}

function startFromCoordinate(coordinate: Coordinate | undefined): { latitude: number; longitude: number } | null {
  if (!coordinate) return null
  return { latitude: coordinate[1], longitude: coordinate[0] }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
