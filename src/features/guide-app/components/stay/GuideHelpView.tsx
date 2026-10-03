import { Phone, Siren } from 'lucide-react'
import { FRENCH_EMERGENCY_NUMBERS } from '@/features/guide-app/lib/emergency-numbers'
import type { GuideLodging } from '@/features/guide-app/types'
import { formatFrenchPhone, frenchPhoneHref } from '@/shared/lib/french-phone'
import { STAY_CARD } from './stay-styles'
import { GuideInfoCard } from '../GuideCard'

/**
 * Onglet Aide (spec 054 AC-01-05) : conciergerie et urgences (BR-05).
 * En démo (spec 045 AC-01-08), aucun lien `tel:` ni lien externe.
 */
export function GuideHelpView({
  lodging,
  onWrite,
  demo = false,
}: {
  lodging: GuideLodging
  onWrite: () => void
  demo?: boolean
}) {
  const emergency = FRENCH_EMERGENCY_NUMBERS[0]
  const conciergePhone = lodging.usefulNumbers.find(item => /conciergerie/i.test(item.label))?.number
    ?? '+33607859058'

  return (
    <div className="min-h-full bg-white px-5 pb-[120px] pt-6">
      <h1 className="text-[30px] font-semibold tracking-[-0.03em] text-[#111111]">Aide</h1>

      <section className={`${STAY_CARD} mt-5 flex items-center gap-4 p-4`}>
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#FCE7F3] text-[15px] font-semibold text-[#BE185D]">
          MS
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-semibold text-[#111111]">Conciergerie MyStay</h2>
          <p className="text-[13px] text-[#697386]">Une question pendant votre séjour ?</p>
        </div>
        <button
          type="button"
          onClick={onWrite}
          className="flex h-11 shrink-0 items-center rounded-full bg-[#111111] px-4 text-[14px] font-semibold text-white"
        >
          Écrire
        </button>
      </section>

      <section className="mt-6">
        <h2 className="inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-semibold uppercase leading-none tracking-[0.08em] text-slate-900">Infos pratiques</h2>
        <div id="guide-practical-panel" className="mt-3 grid gap-2.5">
          <GuideInfoCard
            testId="guide-practical-emergency"
            href={demo ? undefined : frenchPhoneHref(emergency.number)}
            icon={Siren}
            tone="emergency"
            title={emergency.label}
            trailing={emergency.number}
          />
          <GuideInfoCard
            testId="guide-practical-concierge"
            href={demo ? undefined : frenchPhoneHref(conciergePhone)}
            icon={Phone}
            tone="phone"
            title="Conciergerie"
            trailing={formatFrenchPhone(conciergePhone)}
          />
        </div>
      </section>

    </div>
  )
}
