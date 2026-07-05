import { redirect } from 'next/navigation'
import { getPageMerchant } from '@/features/merchant/lib/get-page-merchant'
import { getMerchantDashboardProfile } from '@/features/merchant/queries/dashboard'
import { MerchantProfileForm } from '@/features/merchant/components/MerchantProfileForm'

export default async function MerchantProfilePage() {
  const { redirect_to, merchant } = await getPageMerchant()
  if (redirect_to !== '/merchant/dashboard') redirect(redirect_to)

  const profile = await getMerchantDashboardProfile(merchant.id)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-600">Ma fiche</p>
        <h1 className="mt-2 font-serif text-4xl italic text-charcoal">Informations publiques</h1>
      </div>
      <MerchantProfileForm profile={profile} />
    </div>
  )
}
