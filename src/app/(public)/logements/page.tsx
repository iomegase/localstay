import type { Metadata } from 'next'
import { listPublishedLodgings } from '@/features/lodging-showcase/queries/public-lodgings'
import { LodgingSearch } from '@/features/lodging-showcase/components/LodgingSearch'
import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
  marketingHeroInsetClass,
} from '@/features/marketing/components/MarketingShell'
import { lodgingListMetadata } from '@/features/seo/lib/metadata'

export const metadata: Metadata = lodgingListMetadata()

export default async function LodgingsPage() {
  const lodgings = await listPublishedLodgings()

  return (
    <MarketingShell>
      <section className="py-16 sm:py-24">
        <div className={marketingContainerClass}>
          <div data-testid="lodgings-hero" className={marketingHeroInsetClass}>
            <MarketingEyebrow>Les logements confiés à MyStay</MarketingEyebrow>
            <h1 className="max-w-4xl text-4xl py-8 font-bold leading-[1.03] tracking-[-0.05em] sm:text-6xl">
              {/* Deux lignes, « avec attention. » en serif italique 34 px comme la home (spec 031 AC-01-16). */}
              <span className="block">Des lieux suivis</span>{' '}
              <span className="mt-3 block font-serif text-[34px] font-normal italic leading-[1.1] tracking-[-0.025em]">
                avec attention.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-7 text-slate-500">
              Chaque logement est accompagné par notre conciergerie et dispose de son propre guide
              d’arrivée MyStay.
            </p>
          </div>
        </div>
      </section>

      <section className={`${marketingContainerClass} pb-16 pt-10 sm:pb-24 sm:pt-12`}>
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
