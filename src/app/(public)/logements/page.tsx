import type { Metadata } from 'next'
import { listPublishedLodgings } from '@/features/lodging-showcase/queries/public-lodgings'
import { LodgingSearch } from '@/features/lodging-showcase/components/LodgingSearch'
import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
} from '@/features/marketing/components/MarketingShell'

export const metadata: Metadata = {
  title: 'Nos logements',
  description: 'Découvrez les logements accompagnés par la conciergerie MyStay en Haute-Savoie.',
  alternates: { canonical: '/logements' },
}

export default async function LodgingsPage() {
  const lodgings = await listPublishedLodgings()

  return (
    <MarketingShell>
      <section className="bg-slate-50 py-16 sm:py-24">
        <div className={marketingContainerClass}>
          <MarketingEyebrow>Les logements confiés à MyStay</MarketingEyebrow>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.03] tracking-[-0.055em] sm:text-6xl">
            Des séjours choisis, des lieux suivis avec attention.
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            Chaque logement est accompagné par notre conciergerie et dispose de son propre guide
            d’arrivée MyStay.
          </p>
        </div>
      </section>

      <section className={`${marketingContainerClass} py-16 sm:py-24`}>
        {lodgings.length > 0 ? (
          <LodgingSearch lodgings={lodgings} />
        ) : (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <h2 className="text-2xl font-bold">Aucun logement public n’est encore disponible.</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">
              Les prochaines adresses apparaîtront ici dès leur validation et leur publication par
              l’équipe MyStay.
            </p>
          </div>
        )}
      </section>
    </MarketingShell>
  )
}
