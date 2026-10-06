import { CreditCard } from 'lucide-react'
import { getPageOwner } from '@/features/dashboard-owner/lib/get-page-owner'

// Spec 078 : abonnement pas encore commercialisé — page en veille, sans lecture de la base.
export default async function SubscriptionPage() {
  await getPageOwner()

  return (
    <div className="w-full animate-in fade-in duration-500">
      <section className="flex flex-col items-center rounded-[25px] border border-gray-50 bg-white p-10 text-center shadow-sm sm:p-14">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3F4F8] text-[#0B1437]">
          <CreditCard size={24} strokeWidth={2} aria-hidden="true" />
        </div>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Abonnement</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">L&apos;abonnement arrive bientôt</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500">
          MyStay est gratuit pour le moment. Vous serez prévenu avant toute mise en place d&apos;une formule payante.
        </p>
      </section>
    </div>
  )
}
