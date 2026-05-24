import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { listPendingMerchantClaims } from '@/features/merchant/queries/admin-claims'
import { AdminMerchantClaimsClient } from '@/features/merchant/components/AdminMerchantClaimsClient'

export default async function AdminMerchantClaimsPage() {
  await getPageAdmin()
  const claims = await listPendingMerchantClaims()
  const serializableClaims = claims.map(claim => ({
    ...claim,
    created_at: claim.created_at.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Super-admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-950">Revendications Merchant</h1>
        <p className="mt-2 text-sm text-gray-600">Validation minimale des demandes de rattachement POI.</p>
      </div>
      <AdminMerchantClaimsClient claims={serializableClaims} />
    </div>
  )
}
