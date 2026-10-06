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
  /** Spec 066 AC-02-03 : OPERATIONAL | CLOSED_TEMPORARILY, null si inconnu. */
  business_status: string | null
  /** Spec 071 US-01 : champs modifiables avant publication. */
  phone: string | null
  website: string | null
  description: string | null
  category_id: string
  subcategory_id: string | null
}

export type AcquisitionRunDetail = {
  id: string
  status: string
  error: string | null
  city_name: string
  category_name: string
  /** Spec 066 AC-01-04 / AC-02-02 : lieux écartés avant traitement. */
  skipped_other_village: number
  skipped_closed_permanently: number
  /** Spec 071 AC-04-01 : lieux écartés par la mémoire de revue, candidats exclus masqués. */
  skipped_rejected: number
  skipped_excluded: number
  excluded_candidates: number
  candidates: AcquisitionCandidateDto[]
}

/** Spec 066 AC-04-01 : résultat de la recherche par nom. */
export type AcquisitionNameSearchResult = {
  google_place_id: string
  name: string
  address: string
  business_status: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY' | null
  nearest_city: { slug: string; name: string } | null
  is_other_village: boolean
  /** Spec 071 AC-04-02 : lieu déjà rejeté (catégories) ou exclu de la ville. */
  memory: { kind: 'excluded' | 'rejected'; categories: string[] } | null
}
