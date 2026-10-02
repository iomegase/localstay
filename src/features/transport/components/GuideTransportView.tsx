import { Bus, ChevronRight } from 'lucide-react'
import { GuideStayScreen } from '@/features/guide-app/components/stay/GuideStayScreen'
import type { GuideLodging } from '@/features/guide-app/types'

const CARD = 'rounded-[20px] bg-white p-5 shadow-[0_1px_2px_rgba(17,17,17,0.06)]'

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 rounded-full bg-[#FCE7F3] px-2.5 py-1 text-[12px] font-semibold text-[#BE185D]">
      {children}
    </span>
  )
}

/** Écran « Se déplacer » (spec 055 AC-03-01) : navette Facilibus puis cartes de la ville. */
export function GuideTransportView({
  lodging,
  onBack,
  onOpenFacilibus,
}: {
  lodging: Pick<GuideLodging, 'facilibus' | 'transportCards'>
  onBack: () => void
  onOpenFacilibus: () => void
}) {
  return (
    <GuideStayScreen
      title="Se déplacer"
      subtitle="Laissez la voiture — la vallée se parcourt facilement sans."
      onBack={onBack}
    >
      <div className="grid gap-3">
        {lodging.facilibus ? (
          <button type="button" onClick={onOpenFacilibus} className={`${CARD} text-left`}>
            <span className="flex items-start justify-between gap-3">
              <span className="flex items-center gap-2 text-[16px] font-semibold text-[#111111]">
                <Bus className="h-5 w-5 text-[#DB2777]" strokeWidth={1.8} aria-hidden="true" />
                Navette gratuite
              </span>
              <Tag>Facilibus</Tag>
            </span>
            <span className="mt-2 flex items-end justify-between gap-3">
              <span className="text-[14px] leading-[1.5] text-[#697386]">
                Relie Saint-Gervais et Saint-Nicolas-de-Véroce. Horaires et prochains passages.
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-[#BE185D]" aria-hidden="true" />
            </span>
          </button>
        ) : null}

        {lodging.transportCards.map(card => (
          <article key={card.id} className={CARD}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[16px] font-semibold text-[#111111]">{card.title}</h2>
              {card.tag ? <Tag>{card.tag}</Tag> : null}
            </div>
            <p className="mt-2 text-[14px] leading-[1.5] text-[#697386]">{card.body}</p>
          </article>
        ))}
      </div>
    </GuideStayScreen>
  )
}
