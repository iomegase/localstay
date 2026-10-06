export type AdminSubCategory = {
  id: string
  category_id: string
  name: string
  slug: string
  sort_order: number
  is_active: boolean
  slug_locked: boolean
  poi_count: number
  /** Spec 073 : types Google acceptés à l'acquisition. */
  google_types: string[]
  /** Spec 074 : images de remplacement rattachées (non retirées). */
  fallback_image_count: number
}

export type AdminCategory = {
  id: string
  name: string
  slug: string
  icon: string
  sort_order: number
  is_active: boolean
  slug_locked: boolean
  poi_count: number
  subcategory_count: number
  /** Spec 073 : types Google acceptés à l'acquisition. */
  google_types: string[]
  /** Spec 074 : images de remplacement rattachées, sous-catégories comprises. */
  fallback_image_count: number
  subcategories: AdminSubCategory[]
}

export type CategoryCreateInput = {
  name: string
  slug: string
  icon: string
  sort_order: number
  is_active: boolean
}

export type CategoryPatchInput = Partial<CategoryCreateInput> & { google_types?: string[] }

export type SubCategoryCreateInput = {
  name: string
  slug: string
  sort_order: number
  is_active: boolean
}

export type SubCategoryPatchInput = Partial<SubCategoryCreateInput> & { google_types?: string[] }
