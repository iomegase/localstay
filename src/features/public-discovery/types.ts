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
  category: DiscoveryTaxonomy
  subcategory: DiscoveryTaxonomy | null
  distance_km: number
  zone: DiscoveryZone
}

export type DiscoveryCity = DiscoveryCitySummary & {
  categories: Array<DiscoveryTaxonomy & {
    icon: string
    sort_order: number
    poi_count: number
    pois: DiscoveryPoiCard[]
  }>
}

export type DiscoveryCategory = DiscoveryTaxonomy & {
  icon: string
  sort_order: number
  city: DiscoveryCitySummary
  subcategories: DiscoveryTaxonomy[]
  pois: DiscoveryPoiCard[]
}

export type DiscoveryPoiDetail = Omit<DiscoveryPoiCard, 'photo_url'> & {
  description: string
  phone: string | null
  website: string | null
  hours: PoiHours | null
  photos: string[]
  hero_photo_url: string
  city: DiscoveryCitySummary
}
