import { CompactLodgingCard } from './CompactLodgingCard'
import type { SeminarLodging } from '../queries/seminar-lodgings'
import { marketingContainerClass } from '@/features/marketing/components/marketing-styles'
import { MarketingEyebrow } from '@/features/marketing/components/MarketingShell'

export function SeminarLodgings({ lodgings }: { lodgings: SeminarLodging[] }) {
  if (!lodgings.length) return null

  return (
    <section aria-labelledby="seminar-lodgings-heading" className={`${marketingContainerClass} py-12 sm:py-16`}>
      <div className="mb-[34px] max-w-[760px] sm:mb-12">
        <MarketingEyebrow>La sélection MyStay</MarketingEyebrow>
        <h2 id="seminar-lodgings-heading" className="m-0 max-w-[720px] text-[clamp(34px,4vw,40px)] font-bold leading-[1.02] tracking-[-0.05em] text-slate-800">
          Le cadre idéal pour votre séminaire.
        </h2>
        <p className="mt-5 max-w-[660px] text-sm leading-[1.72] text-slate-500">
          Découvrez notre sélection de logements pour prolonger les échanges et
          partager des moments en équipe, dans le cadre de votre séminaire.
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lodgings.map(lodging => (
          <li key={lodging.id} className="min-w-0">
            <CompactLodgingCard lodging={lodging} />
          </li>
        ))}
      </ul>
    </section>
  )
}
