export const TRAIL_SOURCE_TYPES = ['official_website', 'overpass', 'ign', 'gemini', 'gpx', 'manual'] as const
export type TrailSourceType = (typeof TRAIL_SOURCE_TYPES)[number]

export const TRAIL_SOURCE_USES = ['content', 'geometry', 'elevation', 'description', 'manual_review'] as const
export type TrailSourceUse = (typeof TRAIL_SOURCE_USES)[number]

export const TRAIL_REVIEW_STATUSES = ['needs_review', 'published', 'merged', 'rejected'] as const
export type TrailReviewStatus = (typeof TRAIL_REVIEW_STATUSES)[number]

export const TRAIL_GEOMETRY_STATUSES = ['missing', 'valid', 'invalid', 'needs_review'] as const
export type TrailGeometryStatus = (typeof TRAIL_GEOMETRY_STATUSES)[number]

export const TRAIL_ELEVATION_STATUSES = ['missing', 'valid', 'failed', 'needs_review'] as const
export type TrailElevationStatus = (typeof TRAIL_ELEVATION_STATUSES)[number]

export const TRAIL_DATA_QUALITY_STATUSES = ['draft', 'complete', 'incomplete'] as const
export type TrailDataQualityStatus = (typeof TRAIL_DATA_QUALITY_STATUSES)[number]

export const TRAIL_DIFFICULTIES = ['easy', 'medium', 'hard', 'expert', 'unknown'] as const
export type TrailDifficulty = (typeof TRAIL_DIFFICULTIES)[number]

export type TrailSourceRef = {
  type: TrailSourceType
  name?: string | null
  url?: string | null
  attribution: string
  used_for: TrailSourceUse[]
}

export type TrailCandidateDto = {
  id: string
  title: string
  description: string | null
  primary_source_type: TrailSourceType
  source_refs: TrailSourceRef[]
  difficulty: TrailDifficulty | null
  distance_km: number | null
  elevation_gain_m: number | null
  estimated_duration_min: number | null
  data_quality_status: TrailDataQualityStatus
  start_label: string | null
  start_latitude: number | null
  start_longitude: number | null
  geometry_status: TrailGeometryStatus
  elevation_status: TrailElevationStatus
  duplicate_poi_ids: string[]
  review_status: TrailReviewStatus
  published_poi_id?: string | null
  trail_detail_id?: string | null
}

export type TrailImportRunListItem = {
  id: string
  status: string
  city_name: string
  source_types: TrailSourceType[]
  candidate_count: number
  needs_review_count: number
  published_count: number
  error: string | null
  source_errors: Record<string, string> | null
  created_at: string
}

export type TrailImportRunDetail = {
  id: string
  status: string
  city_name: string
  source_types: TrailSourceType[]
  error: string | null
  source_errors: Record<string, string> | null
  candidates: TrailCandidateDto[]
}
