import type { DescriptionSource } from '@/shared/lib/description-sources'
import type { PoiHours } from '@/features/categories/types'

export type PoiDiscoveryStatus = 'DRAFT' | 'PUBLISHED'

export type PoiDiscoveryEligibility = {
  eligible: boolean
  missing: Array<
    | 'active'
    | 'city'
    | 'category'
    | 'subcategory'
    | 'description'
    | 'photo'
    | 'address'
    | 'geocode'
    | 'contact'
  >
}

export type DiscoveryZone = 'primary' | 'nearby'

export type DiscoveryCitySummary = {
  name: string
  slug: string
  postal_code: string
  department: string | null
  region: string | null
}

export type DiscoveryIndexCity = DiscoveryCitySummary & {
  pois: DiscoveryPoiCard[]
}

export type DiscoveryTaxonomy = {
  name: string
  slug: string
}

export type DiscoveryPoiCard = {
  name: string
  slug: string
  address: string
  latitude: number
  longitude: number
  rating: number | null
  rating_count: number | null
  is_open_now: boolean | null
  photo_url: string
  /** Spec 065 AC-03-03 : image de remplacement (pas une photo du lieu). */
  photo_is_fallback: boolean
  category: DiscoveryTaxonomy
  subcategory: DiscoveryTaxonomy | null
  distance_km: number
  zone: DiscoveryZone
}

export type DiscoverySubcategorySummary = DiscoveryTaxonomy & {
  poi_count: number
}

export type DiscoveryCity = DiscoveryCitySummary & {
  categories: Array<DiscoveryTaxonomy & {
    icon: string
    sort_order: number
    poi_count: number
    /** Spec 065 AC-01-02 : sous-catégories publiques dans l'ordre de la taxonomie. */
    subcategories: DiscoverySubcategorySummary[]
    pois: DiscoveryPoiCard[]
  }>
}

/** Spec 065 AC-02-01 : `subcategory` null = « Autres adresses ». */
export type DiscoveryPoiGroup = {
  subcategory: DiscoveryTaxonomy | null
  pois: DiscoveryPoiCard[]
}

export type DiscoveryCategory = DiscoveryTaxonomy & {
  icon: string
  sort_order: number
  city: DiscoveryCitySummary
  subcategories: DiscoveryTaxonomy[]
  pois: DiscoveryPoiCard[]
  /** Spec 065 AC-02-01 : zone principale découpée par sous-catégorie. */
  groups: DiscoveryPoiGroup[]
  /** Zone « Aux alentours », inchangée (spec 041 AC-02-03). */
  nearby_pois: DiscoveryPoiCard[]
}

export type DiscoveryPoiDetail = Omit<DiscoveryPoiCard, 'photo_url'> & {
  description: string
  /** Spec 094 : pages ayant servi à rédiger la description. */
  description_sources: DescriptionSource[]
  phone: string | null
  website: string | null
  hours: PoiHours | null
  photos: string[]
  hero_photo_url: string
  /** Spec 063 US-04 : origine tierce des photos affichées, ou null si photos MyStay uniquement. */
  photo_credit: { name: string; website: string | null } | null
  city: DiscoveryCitySummary
}
