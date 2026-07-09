// src/features/categories/types.ts
import type { DistanceSource } from './lib/distance-label'

export interface CategoryWithCount {
  id: string
  name: string
  slug: string
  icon: string
  sort_order: number
  poi_count: number
}

export interface SubCategoryWithCount {
  id: string
  name: string
  slug: string
  poi_count: number
}

export interface CategoryDetail extends CategoryWithCount {
  subcategories: SubCategoryWithCount[]
  city_id: string
  city_latitude: number
  city_longitude: number
}

export interface PoiSummary {
  id: string
  name: string
  slug: string
  subcategory_slug: string | null
}

export interface PoiCard {
  id: string
  name: string
  slug: string
  address: string
  subcategory_name: string | null
  rating: number | null
  rating_count: number
  is_open_now: boolean | null
  distance_km: number
  distance_source?: DistanceSource
  photo_url: string | null
  photos: string[]
  phone: string | null
  website: string | null
  description: string | null
  closes_at_label: string | null
  /** Prochaine ouverture (jour + heure) quand le POI est fermé — ex. "demain à 9h". */
  next_open_label?: string | null
  latitude: number
  longitude: number
  trail_detail?: {
    difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'unknown'
    estimated_duration_min: number | null
    distance_km: number | null
    elevation_gain_m: number | null
  } | null
}

export interface PoiCardGroups {
  primary: PoiCard[]   // POI à ≤ 15 km
  nearby: PoiCard[]    // POI géocodés entre 15 et 30 km
  meta: PaginationMeta
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  total_pages: number
  primary_total: number
  nearby_total: number
  primary_total_pages: number
  nearby_total_pages: number
}

export type DayHours = { open: string; close: string } | null

export type PoiHours = {
  '0'?: DayHours  // Sunday
  '1'?: DayHours  // Monday
  '2'?: DayHours  // Tuesday
  '3'?: DayHours  // Wednesday
  '4'?: DayHours  // Thursday
  '5'?: DayHours  // Friday
  '6'?: DayHours  // Saturday
}

export interface HikingDetailData {
  difficulty: 'easy' | 'moderate' | 'hard' | 'expert'
  duration_minutes: number | null
  distance_km: number | null
  elevation_gain_m: number | null
  starting_point: string | null
  parking_info: string | null
  kids_friendly: boolean
  pets_friendly: boolean
  best_season: string[]
  gpx_url: string | null
}

export interface TrailDetailData {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'unknown'
  estimated_duration_min: number | null
  distance_km: number | null
  elevation_gain_m: number | null
  start_label: string | null
  start_latitude: number | null
  start_longitude: number | null
  geometry_geojson: unknown | null
  parking_info: string | null
  kids_friendly: boolean | null
  pets_friendly: boolean | null
  best_season: string[]
  gpx_url: string | null
  data_quality_status: 'complete' | 'incomplete'
  primary_source_type: string
  source_refs: Array<{
    type: string
    name?: string | null
    url?: string | null
    attribution: string
    used_for: string[]
  }>
}

export interface PoiDetail {
  id: string
  name: string
  slug: string
  description: string | null
  address: string
  latitude: number
  longitude: number
  phone: string | null
  website: string | null
  rating: number | null
  rating_count: number
  is_open_now: boolean | null
  hours: PoiHours | null
  photos: string[]
  distance_km: number | null
  distance_source?: DistanceSource | null
  city: { name: string; slug: string; region: string | null; postal_code: string }
  category: { id: string; name: string; slug: string; icon: string }
  subcategory: { id: string; name: string; slug: string } | null
  trail_detail?: TrailDetailData | null
  hiking_detail: HikingDetailData | null
  merchant_offers: Array<{
    id: string
    title: string
    description: string
    ends_at: string
    status: 'active' | 'expired'
  }>
}
