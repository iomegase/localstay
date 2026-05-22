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
}
