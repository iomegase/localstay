// Types match the API contract schemas defined in spec 001 exactly.
// Any field change here must be reflected in the spec first.

export interface CitySearchResult {
  id: string
  name: string
  slug: string
  postal_code: string
  department: string | null
}

export interface CategorySummary {
  id: string
  name: string
  slug: string
  icon: string
  sort_order: number
  poi_count: number
}

export interface CityGuide {
  city: CitySearchResult
  categories: CategorySummary[]
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}
