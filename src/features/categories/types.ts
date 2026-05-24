// src/features/categories/types.ts

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
  photo_url: string | null
  latitude: number
  longitude: number
  owner_note?: string | null
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
  category: { id: string; name: string; slug: string; icon: string }
  subcategory: { id: string; name: string; slug: string } | null
  hiking_detail: HikingDetailData | null
  merchant_offers: Array<{
    id: string
    title: string
    description: string
    ends_at: string
    status: 'active' | 'expired'
  }>
}
