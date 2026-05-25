import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import { toSourceRefs } from './runs'
import type { TrailDifficulty, TrailSourceRef, TrailSourceType } from '../types'

export type PublishedTrailListItem = {
  id: string
  name: string
  slug: string
  description: string | null
  distance_km: number | null
  elevation_gain_m: number | null
  estimated_duration_min: number | null
  difficulty: TrailDifficulty
  start_label: string | null
  start_latitude: number
  start_longitude: number
  primary_source_type: TrailSourceType
  source_refs: TrailSourceRef[]
}

export type PublishedTrailDetail = PublishedTrailListItem & {
  geometry_geojson: unknown | null
  data_quality_status: string
  parking_info: string | null
  kids_friendly: boolean | null
  pets_friendly: boolean | null
  best_season: string[]
  gpx_url: string | null
}

export async function listPublishedTrails(citySlug: string): Promise<PublishedTrailListItem[]> {
  const trails = await prisma.pointOfInterest.findMany({
    where: {
      is_active: true,
      deleted_at: null,
      city: { slug: citySlug, is_active: true, deleted_at: null },
      category: { slug: 'rando', is_active: true, deleted_at: null },
      trail_detail: { is_active: true, deleted_at: null },
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      trail_detail: {
        select: {
          difficulty: true,
          distance_km: true,
          elevation_gain_m: true,
          estimated_duration_min: true,
          start_label: true,
          start_latitude: true,
          start_longitude: true,
          primary_source_type: true,
          source_refs: true,
        },
      },
    },
  })

  return trails.flatMap(trail => {
    if (!trail.trail_detail) return []
    return [mapPublishedTrailListItem({ ...trail, trail_detail: trail.trail_detail })]
  })
}

export async function getPublishedTrail(citySlug: string, trailSlug: string): Promise<PublishedTrailDetail | null> {
  const trail = await prisma.pointOfInterest.findFirst({
    where: {
      slug: trailSlug,
      is_active: true,
      deleted_at: null,
      city: { slug: citySlug, is_active: true, deleted_at: null },
      category: { slug: 'rando', is_active: true, deleted_at: null },
      trail_detail: { is_active: true, deleted_at: null },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      trail_detail: {
        select: {
          difficulty: true,
          distance_km: true,
          elevation_gain_m: true,
          estimated_duration_min: true,
          start_label: true,
          start_latitude: true,
          start_longitude: true,
          geometry_geojson: true,
          data_quality_status: true,
          primary_source_type: true,
          source_refs: true,
          parking_info: true,
          kids_friendly: true,
          pets_friendly: true,
          best_season: true,
          gpx_url: true,
        },
      },
    },
  })

  if (!trail?.trail_detail) return null
  const trailDetail = trail.trail_detail
  return {
    ...mapPublishedTrailListItem({ ...trail, trail_detail: trailDetail }),
    geometry_geojson: trailDetail.geometry_geojson,
    data_quality_status: trailDetail.data_quality_status,
    parking_info: trailDetail.parking_info,
    kids_friendly: trailDetail.kids_friendly,
    pets_friendly: trailDetail.pets_friendly,
    best_season: trailDetail.best_season,
    gpx_url: trailDetail.gpx_url,
  }
}

function mapPublishedTrailListItem(trail: {
  id: string
  name: string
  slug: string
  description: string | null
  trail_detail: {
    difficulty: string
    distance_km: number | null
    elevation_gain_m: number | null
    estimated_duration_min: number | null
    start_label: string | null
    start_latitude: number
    start_longitude: number
    primary_source_type: string
    source_refs: Prisma.JsonValue
  }
}): PublishedTrailListItem {
  return {
    id: trail.id,
    name: trail.name,
    slug: trail.slug,
    description: trail.description,
    difficulty: trail.trail_detail.difficulty as TrailDifficulty,
    distance_km: trail.trail_detail.distance_km,
    elevation_gain_m: trail.trail_detail.elevation_gain_m,
    estimated_duration_min: trail.trail_detail.estimated_duration_min,
    start_label: trail.trail_detail.start_label,
    start_latitude: trail.trail_detail.start_latitude,
    start_longitude: trail.trail_detail.start_longitude,
    primary_source_type: trail.trail_detail.primary_source_type as TrailSourceType,
    source_refs: toSourceRefs(trail.trail_detail.source_refs),
  }
}
