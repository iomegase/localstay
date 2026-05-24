export type ClaimStatus = 'pending' | 'approved' | 'rejected'
export type MerchantProfileStatus = 'active' | 'suspended'
export type MerchantOnboardingState = 'needs_claim' | 'pending_review' | 'rejected' | 'approved'

export type ClaimablePoiDto = {
  id: string
  name: string
  address: string
  city_name: string
  category_name: string
  subcategory_name: string | null
}

export type MerchantClaimDto = {
  id: string
  merchant_id: string
  poi_id: string
  status: ClaimStatus
  created_at: Date
  reviewed_at: Date | null
  admin_note: string | null
}

export type MerchantProfileDto = {
  id: string
  merchant_id: string
  poi_id: string
  status: MerchantProfileStatus
  approved_claim_id: string
}

export type MerchantOnboardingStatusDto = {
  state: MerchantOnboardingState
  claim: MerchantClaimDto | null
  profile: MerchantProfileDto | null
}

export type MerchantPoiDto = {
  id: string
  name: string
  description: string | null
  hours: Record<string, unknown> | null
  phone: string | null
  website: string | null
  photos: string[]
  public_url: string
}

export type MerchantDashboardProfileDto = {
  id: string
  poi: MerchantPoiDto
}

export type MerchantStatsDto = {
  period_days: 30
  totals: {
    profile_views: number
    phone_clicks: number
    directions_clicks: number
    website_clicks: number
  }
  views_series: Array<{ date: string; count: number }>
}

export type MerchantOfferStatus = 'active' | 'expired'

export type MerchantOfferDto = {
  id: string
  title: string
  description: string
  ends_at: string
  status: MerchantOfferStatus
}
