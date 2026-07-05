import { redirect } from 'next/navigation'
import { getPageMerchant } from '@/features/merchant/lib/get-page-merchant'
import { MerchantOnboardingClient } from '@/features/merchant/components/MerchantOnboardingClient'
import { getMissingPoiFormOptions } from '@/features/poi-acquisition/queries/missing-poi'

export default async function MerchantOnboardingPage() {
  const { redirect_to, merchant } = await getPageMerchant()
  if (redirect_to === '/merchant/dashboard') redirect('/merchant/dashboard')

  const pendingClaim = merchant.merchant_claims.find(claim => claim.status === 'pending')
  const options = pendingClaim ? { cities: [], categories: [] } : await getMissingPoiFormOptions()

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-600">Onboarding Merchant</p>
        <h1 className="mt-2 text-4xl text-charcoal">Revendiquer mon établissement</h1>
        <p className="mt-3 max-w-2xl text-charcoal/60">
          Recherchez votre fiche existante, puis envoyez une demande de validation à l'équipe MyStay.
        </p>
      </div>

      {pendingClaim ? (
        <div className="rounded-2xl border border-pink-600/30 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-charcoal">Votre demande est en cours de validation</h2>
          <p className="mt-2 text-sm text-charcoal/60">
            Demande créée le {new Intl.DateTimeFormat('fr-FR').format(pendingClaim.created_at)}.
            Vous serez redirigé vers le dashboard après validation.
          </p>
        </div>
      ) : (
        <MerchantOnboardingClient cities={options.cities} categories={options.categories} />
      )}
    </div>
  )
}
