import { MapPin, Siren } from 'lucide-react'
import { FRENCH_EMERGENCY_NUMBERS } from '@/features/guide-app/lib/emergency-numbers'
import type { GuideLodging } from '@/features/guide-app/types'
import { frenchPhoneHref } from '@/shared/lib/french-phone'
import { lodgingMapsHref, STAY_CARD } from './stay-styles'

/**
 * Onglet Aide (spec 054 AC-01-05) : conciergerie, urgences (BR-05), adresse.
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
  return (
    <div className="min-h-full bg-[#F6F6F4] px-5 pb-[120px] pt-6">
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
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#B3261E]">Urgences</h2>
        <div className="mt-2 grid gap-2">
          {FRENCH_EMERGENCY_NUMBERS.map(item => {
            const Row = demo ? 'div' : 'a'
            return (
              <Row
                key={item.number}
                href={demo ? undefined : frenchPhoneHref(item.number)}
                className={`${STAY_CARD} flex min-h-[56px] items-center gap-3 px-4`}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#F4E4E2] text-[#B3261E]">
                  <Siren className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 text-[15px] font-semibold text-[#111111]">{item.label}</span>
                <span className="text-[15px] font-semibold text-[#B3261E]">{item.number}</span>
              </Row>
            )
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#697386]">Adresse</h2>
        <div className={`${STAY_CARD} mt-2 p-4`}>
          <p className="flex gap-3 text-[15px] leading-snug text-[#111111]">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#DB2777]" strokeWidth={1.8} aria-hidden="true" />
            <span>{lodging.addressLabel}</span>
          </p>
          {demo ? null : (
            <a
              href={lodgingMapsHref(lodging.latitude, lodging.longitude)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex min-h-11 items-center text-[14px] font-semibold text-[#DB2777]"
            >
              Ouvrir dans Maps
            </a>
          )}
        </div>
      </section>
    </div>
  )
}
