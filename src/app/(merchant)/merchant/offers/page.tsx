import { redirect } from 'next/navigation'
import { getPageMerchant } from '@/features/merchant/lib/get-page-merchant'
import { listMerchantOffers } from '@/features/merchant/queries/dashboard'
import { MerchantOffersClient } from '@/features/merchant/components/MerchantOffersClient'

export default async function MerchantOffersPage() {
  const { redirect_to, merchant } = await getPageMerchant()
  if (redirect_to !== '/merchant/dashboard') redirect(redirect_to)

  const offers = await listMerchantOffers(merchant.id)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-600">Offres</p>
        <h1 className="mt-2 text-4xl text-charcoal">Offres spéciales</h1>
      </div>
      <MerchantOffersClient initialOffers={offers} />
    </div>
  )
}
