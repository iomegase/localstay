type MerchantRedirectInput = {
  merchant_profile?: { status: string; deleted_at: Date | null } | null
  merchant_claims?: Array<{ status: string }> | null
}

export function getMerchantRedirect(user: MerchantRedirectInput): string {
  if (user.merchant_profile?.status === 'active' && user.merchant_profile.deleted_at === null) {
    return '/merchant/dashboard'
  }

  const pendingClaim = user.merchant_claims?.some(claim => claim.status === 'pending') ?? false
  if (pendingClaim) return '/merchant/onboarding?status=pending'

  return '/merchant/onboarding'
}
