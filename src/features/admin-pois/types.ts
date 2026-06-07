export type AdminPoiStatus = 'active' | 'inactive' | 'archived'
export type AdminPoiStatusFilter = 'current' | AdminPoiStatus
export type AdminPoiPhotoStatus = 'with_photos' | 'without_photos'
export type AdminPoiReviewSource = 'MANUAL' | 'GOOGLE'

export type AdminPoiCity = {
  id: string
  name: string
  slug: string
}

export type AdminPoiCategory = {
  id: string
  name: string
  slug: string
  subcategories?: AdminPoiSubCategory[]
}

export type AdminPoiSubCategory = {
  id: string
  name: string
  slug: string
}

export type AdminPoiListItem = {
  id: string
  name: string
  slug: string
  status: AdminPoiStatus
  city: AdminPoiCity
  category: AdminPoiCategory
  subcategory: AdminPoiSubCategory | null
  address: string
  geocode_status: string
  photo_count: number
  primary_photo_url: string | null
  photos_status: string
  review_source: AdminPoiReviewSource
  merchant_attached: boolean
  has_trail_detail: boolean
  updated_at: string
  public_url: string
}

export type AdminPoiTrailDetail = {
  difficulty: string
  distance_km: number | null
  elevation_gain_m: number | null
  estimated_duration_min: number | null
  geometry_geojson: unknown | null
  start_latitude: number | null
  start_longitude: number | null
  data_quality_status: string
}

export type AdminPoiDetail = AdminPoiListItem & {
  description: string | null
  phone: string | null
  website: string | null
  photos: string[]
  tags: string[]
  latitude: number
  longitude: number
  slug_editable: false
  trail_fields_locked: boolean
  trail_detail: AdminPoiTrailDetail | null
}

export type AdminPoiKpis = {
  active_count: number
  inactive_count: number
  archived_count: number
  without_photos_count: number
  pending_geocode_count: number
}

export type AdminPoiAcquisitionRunSummary = {
  id: string
  status: string
  category_name: string
  candidate_count: number
  needs_review_count: number
  published_count: number
  created_at: string
}

export type AdminPoiListResponse = {
  data: AdminPoiListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
  kpis: AdminPoiKpis
  acquisition_runs: AdminPoiAcquisitionRunSummary[]
}

export type AdminPoiListFilters = {
  city_id: string
  q?: string
  category_id?: string
  subcategory_id?: string
  status?: AdminPoiStatusFilter
  geocode_status?: string
  photo_status?: AdminPoiPhotoStatus
  review_source?: AdminPoiReviewSource
  page: number
  limit: number
}
