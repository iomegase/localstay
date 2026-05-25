import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { listPendingMerchantClaims } from '@/features/merchant/queries/admin-claims'
import { AdminMerchantClaimsClient } from '@/features/merchant/components/AdminMerchantClaimsClient'
import { ShieldCheck } from 'lucide-react'

export default async function AdminMerchantClaimsPage() {
  await getPageAdmin()
  const claims = await listPendingMerchantClaims()
  const serializableClaims = claims.map(claim => ({
    ...claim,
    created_at: claim.created_at.toISOString(),
  }))

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="group flex flex-col gap-2 pb-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-500" strokeWidth={2.5} />
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-500">
            Super-admin
          </p>
        </div>
        
        <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 transition-colors">
                Revendications Merchant
              </h1>
              {serializableClaims.length > 0 && (
                <span className="inline-flex animate-pulse items-center justify-center rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600 ring-1 ring-inset ring-rose-200/50 shadow-sm transition-transform hover:scale-105 cursor-default">
                  {serializableClaims.length} en attente
                </span>
              )}
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Validation des demandes pending avec Merchant, POI, ville et date de demande.
            </p>
          </div>
        </div>
      </header>

      <div className="w-full overflow-hidden transition-all duration-300">
        <AdminMerchantClaimsClient claims={serializableClaims} />
      </div>
    </div>
  )
}