import type { PoiHours } from '@/features/categories/types'

export type GoogleReviewPayload = {
  displayName?: { text?: string }
  formattedAddress?: string
  rating?: number
  userRatingCount?: number
  hours?: PoiHours
  attribution: 'Google Maps'
}

export type GooglePolicyResult = {
  google_place_id: string | null
  review_payload: GoogleReviewPayload | null
}

export type AcquisitionGeocode =
  | { status: 'success'; latitude: number; longitude: number; confidence: number }
  | { status: 'pending_review'; latitude: number; longitude: number; confidence: number; reason: string }
  | { status: 'failed'; reason: string }
  | { status: 'rejected'; reason: string }

export type DuplicateCandidateInput = {
  name: string
  address: string
  latitude?: number | null
  longitude?: number | null
  google_place_id?: string | null
}

export type DuplicatePoi = DuplicateCandidateInput & {
  id: string
}

export type AcquisitionRunListItem = {
  id: string
  status: string
  error: string | null
  city_name: string
  category_name: string
  candidate_count: number
  published_count: number
  needs_review_count: number
  created_at: string
}

export type AcquisitionCandidateDto = {
  id: string
  name: string
  address: string
  source: string
  match_status: string
  geocode_status: string
  review_status: string
  duplicate_poi_ids: string[]
  google_place_id: string | null
  google_review_payload: GoogleReviewPayload | null
}

export type AcquisitionRunDetail = {
  id: string
  status: string
  error: string | null
  city_name: string
  category_name: string
  candidates: AcquisitionCandidateDto[]
}
