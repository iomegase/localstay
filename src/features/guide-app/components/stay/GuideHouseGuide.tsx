'use client'

import { useState } from 'react'
import { Eye, Phone, Recycle } from 'lucide-react'
import { houseRuleTitle } from '@/features/guide-app/lib/fixed-lodging-content'
import { inlineMarkdown } from '@/features/guide-app/lib/inline-markdown'
import type { GuideLodging, GuidePracticalCard } from '@/features/guide-app/types'
import { extractYouTubeId, youTubeThumbnailUrl } from '@/shared/lib/youtube'
import { GuideDarkMarkdown } from '../GuideDarkMarkdown'
import { GuideStayScreen } from './GuideStayScreen'
import { STAY_CARD } from './stay-styles'
import { recyclingMapsHref } from '@/features/guide-app/lib/recycling-maps'

const SECTION_PILL = 'inline-flex w-fit rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-semibold uppercase leading-none tracking-[0.08em] text-slate-900'

/** Guide logement : équipements + règles en accordéon (spec 054 AC-04-01). */
export function GuideHouseGuide({
  lodging,
  onBack,
  demo = false,
}: {
  lodging: GuideLodging
  onBack: () => void
  demo?: boolean
}) {
  const [openRule, setOpenRule] = useState<number | null>(null)
  const equipment = lodging.practicalCards.filter(card => card.icon !== 'recycle')
  const recycling = lodging.practicalCards.filter(card => card.icon === 'recycle')

  return (
    <GuideStayScreen title="Guide logement" onBack={onBack}>
      {equipment.length > 0 && (
        <section>
          <h2 className={SECTION_PILL}>Équipements</h2>
          <div className="mt-3 grid gap-2.5">
            {equipment.map(card => (
              <EquipmentCard key={card.id} card={card} />
            ))}
          </div>
        </section>
      )}

      {lodging.houseRules.length > 0 && (
        <section className="mt-[26px]">
          <h2 className={SECTION_PILL}>Règlement</h2>
          <div className={`${STAY_CARD} mt-3 divide-y divide-[rgba(17,17,17,0.08)]`}>
            {lodging.houseRules.map((rule, index) => {
              const open = openRule === index
              const panelId = `guide-rule-${index}`
              return (
                <div key={`${rule}-${index}`}>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenRule(open ? null : index)}
                    className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left text-sm font-semibold text-[#111111]"
                  >
                    {houseRuleTitle(rule, index)}
                    <span aria-hidden="true" className="text-[20px] font-medium leading-none text-[#DB2777]">
                      {open ? '−' : '+'}
                    </span>
                  </button>
                  {open && (
                    <p id={panelId} className="px-4 pb-4 text-xs leading-[1.5] text-[#374151]">
                      {inlineMarkdown(rule)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="mt-[26px]">
        <h2 className={SECTION_PILL}>Point de tri</h2>
        <div className="mt-3 grid gap-2.5">
          {recycling.map(card => <EquipmentCard key={card.id} card={card} />)}
          <div className="flex min-h-[76px] w-full items-center gap-2.5 rounded-[20px] bg-white p-3 text-left tracking-[-0.025em] shadow-md transition-[transform,box-shadow] duration-200 hover:shadow-sm">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-slate-100 text-black">
              <Recycle className="h-7 w-7 stroke-1" strokeWidth={1} aria-hidden="true" />
            </span>
            <p className="min-w-0 flex-1 text-[15px] font-semibold text-[#111111]">Trouver le point de recyclage</p>
            {!demo && (
              <a
                href={recyclingMapsHref(lodging.trashLocation, lodging.city)}
                target="_blank"
                rel="noreferrer"
                aria-label="Ouvrir dans Maps"
                className="-mr-3 grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#BE185D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BE185D]"
              >
                <Eye strokeWidth={1} className="h-5 w-5 stroke-1" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </section>

    </GuideStayScreen>
  )
}

/** Équipement : vignette 76 px non interactive, texte, appel éventuel. */
function EquipmentCard({ card }: { card: GuidePracticalCard }) {
  const videoId = card.videoUrl ? extractYouTubeId(card.videoUrl) : null
  const thumbnail = card.photoUrl ?? (videoId ? youTubeThumbnailUrl(videoId) : null)

  return (
    <article data-testid="guide-equipment" className={`${STAY_CARD} grid grid-cols-[88px_1fr] gap-3 p-1.5 pr-4`}>
      <div className="h-[76px] w-[76px] self-center justify-self-center overflow-hidden rounded-xl bg-white">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 py-2">
        <h3 className="text-[15px] font-semibold text-[#111111]">{card.title}</h3>
        <div className="mt-0.5 text-[13px] leading-[1] text-[#697386]">
          <GuideDarkMarkdown source={card.description} />
        </div>
        {card.phone ? (
          <a
            href={`tel:${card.phone.replace(/\s/g, '')}`}
            className="mt-2 inline-flex min-h-11 items-center gap-2 text-[14px] font-semibold text-[#DB2777]"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {card.phone}
          </a>
        ) : null}
      </div>
    </article>
  )
}
