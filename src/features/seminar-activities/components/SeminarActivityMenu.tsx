import { marketingContainerClass } from '@/features/marketing/components/marketing-styles'
import { MarketingEyebrow } from '@/features/marketing/components/MarketingShell'
import { SeminarActivityGrid } from './SeminarActivityGrid'
import type { PublicSeminarActivity } from '../types'

/**
 * Spec 097 US-06 : section vitrine « Le menu d'activités », sur `/seminaires` et
 * les landings séminaire. Absente sans carte (BR-12) ; pas de CTA de devis.
 */
export function SeminarActivityMenu({ activities }: { activities: PublicSeminarActivity[] }) {
  if (!activities.length) return null

  return (
    <section aria-labelledby="seminar-activities-heading" className={`${marketingContainerClass} py-12 sm:py-16`}>
      <div className="mb-[34px] max-w-[760px] sm:mb-12">
        <MarketingEyebrow>Activités</MarketingEyebrow>
        <h2 id="seminar-activities-heading" className="m-0 max-w-[720px] text-[clamp(34px,4vw,40px)] font-bold leading-[1.02] tracking-[-0.05em] text-slate-800">
          Le menu d’activités.
        </h2>
        <p className="mt-5 max-w-[660px] text-sm leading-[1.72] text-slate-500">
          Team building, sports de montagne, bien-être ou gastronomie : nous
          composons avec nos partenaires locaux le programme qui fait vivre votre
          séminaire, en toute saison.
        </p>
      </div>
      <SeminarActivityGrid activities={activities} />
    </section>
  )
}
