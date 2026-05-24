export type AdminSubCategory = {
  id: string
  category_id: string
  name: string
  slug: string
  sort_order: number
  is_active: boolean
  slug_locked: boolean
  poi_count: number
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
  subcategories: AdminSubCategory[]
}

export type CategoryCreateInput = {
  name: string
  slug: string
  icon: string
  sort_order: number
  is_active: boolean
}

export type CategoryPatchInput = Partial<CategoryCreateInput>

export type SubCategoryCreateInput = {
  name: string
  slug: string
  sort_order: number
  is_active: boolean
}

export type SubCategoryPatchInput = Partial<SubCategoryCreateInput>
