const GUIDE_RADIUS_KM = 30
const FEATURED_POI_LIMIT_PER_CATEGORY = 5

export interface CategoryOrderFilterResult {
  category_order: string[]
  ignored_category_slugs: string[]
}

export interface PoiGuideScopeInput {
  city_id: string
  lodging_city_id: string
  is_active: boolean
  deleted_at: Date | null
  geocode_status: string
  distance_km: number
}

export interface FeaturedPoiCategoryInput {
  poi_id: string
  category_id: string
}

export function filterValidCategoryOrder(
  requestedSlugs: string[],
  validSlugs: Set<string>,
): CategoryOrderFilterResult {
  const seen = new Set<string>()
  const category_order: string[] = []
  const ignored_category_slugs: string[] = []

  for (const slug of requestedSlugs) {
    if (!validSlugs.has(slug)) {
      ignored_category_slugs.push(slug)
      continue
    }

    if (!seen.has(slug)) {
      category_order.push(slug)
      seen.add(slug)
    }
  }

  return { category_order, ignored_category_slugs }
}

export function isPoiWithinGuideScope(input: PoiGuideScopeInput): boolean {
  if (input.city_id !== input.lodging_city_id) return false
  if (!input.is_active || input.deleted_at !== null) return false
  if (input.geocode_status === 'rejected') return false
  if (input.geocode_status === 'success' && input.distance_km > GUIDE_RADIUS_KM) return false
  return true
}

export function groupFeaturedPoisByCategory(
  featuredPois: FeaturedPoiCategoryInput[],
): Map<string, FeaturedPoiCategoryInput[]> {
  const grouped = new Map<string, FeaturedPoiCategoryInput[]>()

  for (const featuredPoi of featuredPois) {
    const existing = grouped.get(featuredPoi.category_id) ?? []
    existing.push(featuredPoi)
    if (existing.length > FEATURED_POI_LIMIT_PER_CATEGORY) {
      throw new Error('FEATURED_POI_LIMIT_EXCEEDED')
    }
    grouped.set(featuredPoi.category_id, existing)
  }

  return grouped
}
