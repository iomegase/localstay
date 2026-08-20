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
