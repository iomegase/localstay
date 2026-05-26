import type { Prisma } from '@prisma/client'
import type { TrailDifficulty, TrailSourceRef } from '../types'

type OverpassPoint = { lat?: number; lon?: number }

type OverpassMember = {
  type?: string
  ref?: number
  role?: string
  geometry?: OverpassPoint[]
}

type OverpassElement = {
  type?: string
  id?: number
  tags?: Record<string, string>
  geometry?: OverpassPoint[]
  members?: OverpassMember[]
}

export type OverpassPayload = {
  elements?: OverpassElement[]
}

export type OverpassTrailCandidate = {
  primary_source_type: 'overpass'
  source_refs: TrailSourceRef[]
  title: string
  description: string | null
  raw_payload: Prisma.InputJsonValue
  geometry_geojson: Prisma.InputJsonValue
  geometry_status: 'valid'
  start_latitude: number
  start_longitude: number
  difficulty: TrailDifficulty
  distance_km: number
  metric_source: 'computed_geometry'
}

export function normalizeOverpassTrails(payload: OverpassPayload): OverpassTrailCandidate[] {
  return (payload.elements ?? []).flatMap(element => {
    if (!isTrailCandidateElement(element)) return []
    const coordinates = extractCoordinates(element)
    if (coordinates.length < 2) return []

    const title = element.tags?.name?.trim()
    if (!title) return []

    return [{
      primary_source_type: 'overpass',
      source_refs: [{
        type: 'overpass',
        name: title,
        attribution: 'OpenStreetMap contributors',
        used_for: ['geometry'],
      }],
      title,
      description: null,
      raw_payload: element as Prisma.InputJsonValue,
      geometry_geojson: {
        type: 'LineString',
        coordinates,
      },
      geometry_status: 'valid',
      start_latitude: coordinates[0][1],
      start_longitude: coordinates[0][0],
      difficulty: difficultyFromSacScale(element.tags?.sac_scale),
      distance_km: distanceFromCoordinates(coordinates),
      metric_source: 'computed_geometry',
    }]
  })
}

function isTrailCandidateElement(element: OverpassElement): boolean {
  const tags = element.tags ?? {}
  if (tags.route === 'hiking' && Boolean(tags.name?.trim())) return true

  const highway = tags.highway
  const isNamedPath = highway === 'path' || highway === 'track' || highway === 'footway'
  if (!isNamedPath || !tags.name?.trim()) return false

  return /(randonn[ée]e|rando|sentier|trail|boucle|itin[ée]raire)/i.test(
    `${tags.name} ${tags.description ?? ''} ${tags.route ?? ''}`,
  )
}

function extractCoordinates(element: OverpassElement): Array<[number, number]> {
  // 1. Format simple (way ou relation simplifiée dans les tests) : geometry sur l'élément
  if (Array.isArray(element.geometry) && element.geometry.length > 0) {
    return pointsToCoordinates(element.geometry)
  }
  // 2. Format réel des relations OSM : assemblage des members[].geometry
  if (Array.isArray(element.members) && element.members.length > 0) {
    return element.members.flatMap(member => pointsToCoordinates(member.geometry))
  }
  return []
}

function pointsToCoordinates(points: OverpassPoint[] | undefined): Array<[number, number]> {
  if (!Array.isArray(points)) return []
  return points.flatMap(point => {
    if (
      typeof point.lat === 'number' &&
      Number.isFinite(point.lat) &&
      typeof point.lon === 'number' &&
      Number.isFinite(point.lon)
    ) {
      return [[point.lon, point.lat] as [number, number]]
    }
    return []
  })
}

function difficultyFromSacScale(value: string | undefined): TrailDifficulty {
  switch (value) {
    case 'hiking':
      return 'easy'
    case 'mountain_hiking':
      return 'medium'
    case 'demanding_mountain_hiking':
      return 'hard'
    case 'alpine_hiking':
    case 'demanding_alpine_hiking':
    case 'difficult_alpine_hiking':
      return 'expert'
    default:
      return 'unknown'
  }
}

function distanceFromCoordinates(coordinates: Array<[number, number]>): number {
  const distance = coordinates.slice(1).reduce((sum, coordinate, index) => {
    return sum + distanceBetween(coordinates[index], coordinate)
  }, 0)
  return Math.round(distance * 10) / 10
}

function distanceBetween(start: [number, number], end: [number, number]): number {
  const earthRadiusKm = 6371
  const startLat = toRadians(start[1])
  const endLat = toRadians(end[1])
  const deltaLat = toRadians(end[1] - start[1])
  const deltaLon = toRadians(end[0] - start[0])
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRadians(value: number): number {
  return value * Math.PI / 180
}
