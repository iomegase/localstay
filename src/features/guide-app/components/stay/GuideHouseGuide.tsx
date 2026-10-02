'use client'

import { useState } from 'react'
import { ChevronRight, Phone, Play } from 'lucide-react'
import { houseRuleTitle } from '@/features/guide-app/lib/fixed-lodging-content'
import { inlineMarkdown } from '@/features/guide-app/lib/inline-markdown'
import type { GuideLodging, GuidePracticalCard } from '@/features/guide-app/types'
import { extractYouTubeId, youTubeThumbnailUrl } from '@/shared/lib/youtube'
import { GuideDarkMarkdown } from '../GuideDarkMarkdown'
import { MediaLightbox, type LightboxContent } from '../MediaLightbox'
import { GuideStayScreen } from './GuideStayScreen'
import { STAY_CARD, STAY_SECTION_TITLE } from './stay-styles'

/** Guide logement : équipements + règles en accordéon (spec 054 AC-04-01). */
export function GuideHouseGuide({
  lodging,
  onBack,
  onOpenPractical,
}: {
  lodging: GuideLodging
  onBack: () => void
  /** Absent dans la démo, qui n'a pas d'écran « Infos pratiques ». */
  onOpenPractical?: () => void
}) {
  const [openRule, setOpenRule] = useState<number | null>(null)
  // Le tri des déchets reste dans « Infos pratiques » (comme avant la refonte).
  const equipment = lodging.practicalCards.filter(card => card.icon !== 'recycle')
  const hasPracticalInfo =
    Boolean(onOpenPractical) &&
    (lodging.usefulNumbers.length > 0 ||
    lodging.trashBins.length > 0 ||
    Boolean(lodging.trashLocation) ||
    lodging.practicalCards.some(card => card.icon === 'recycle'))

  return (
    <GuideStayScreen title="Guide logement" onBack={onBack}>
      {equipment.length > 0 && (
        <section>
          <h2 className={STAY_SECTION_TITLE}>Équipements</h2>
          <div className="mt-3 grid gap-2.5">
            {equipment.map(card => (
              <EquipmentCard key={card.id} card={card} />
            ))}
          </div>
        </section>
      )}

      {lodging.houseRules.length > 0 && (
        <section className="mt-[26px]">
          <h2 className={STAY_SECTION_TITLE}>Règles</h2>
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
                    className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left text-[15px] font-semibold text-[#111111]"
                  >
                    {houseRuleTitle(rule, index)}
                    <span aria-hidden="true" className="text-[20px] font-medium leading-none text-[#DB2777]">
                      {open ? '−' : '+'}
                    </span>
                  </button>
                  {open && (
                    <p id={panelId} className="px-4 pb-4 text-[14px] leading-[1.5] text-[#374151]">
                      {inlineMarkdown(rule)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {hasPracticalInfo && (
        <button
          type="button"
          onClick={onOpenPractical}
          className={`${STAY_CARD} mt-[26px] flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left`}
        >
          <span>
            <span className="block text-[15px] font-semibold text-[#111111]">Infos pratiques</span>
            <span className="block text-[13px] text-[#697386]">Numéros utiles, tri des déchets</span>
          </span>
          <ChevronRight className="h-5 w-5 text-[#DB2777]" aria-hidden="true" />
        </button>
      )}
    </GuideStayScreen>
  )
}

/** Équipement : vignette 76 px (photo ou vidéo → lightbox), texte, appel éventuel. */
function EquipmentCard({ card }: { card: GuidePracticalCard }) {
  const [lightbox, setLightbox] = useState<LightboxContent | null>(null)
  const videoId = card.videoUrl ? extractYouTubeId(card.videoUrl) : null
  const thumbnail = card.photoUrl ?? (videoId ? youTubeThumbnailUrl(videoId) : null)
  const media: LightboxContent | null = card.photoUrl
    ? { kind: 'photos', photos: [card.photoUrl], startIndex: 0 }
    : card.videoUrl && videoId
      ? { kind: 'video', url: card.videoUrl }
      : null

  return (
    <article data-testid="guide-equipment" className={`${STAY_CARD} grid grid-cols-[88px_1fr] gap-3 p-1.5 pr-4`}>
      <button
        type="button"
        disabled={!media}
        aria-label={media ? `Voir — ${card.title}` : undefined}
        onClick={() => media && setLightbox(media)}
        className="relative h-[76px] w-[76px] self-start justify-self-center overflow-hidden rounded-xl bg-[#EFEDE9] disabled:cursor-default"
      >
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt="" className="h-full w-full object-cover" />
        ) : null}
        {!card.photoUrl && videoId ? (
          <span className="absolute inset-0 grid place-items-center bg-black/20">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#111111]">
              <Play className="h-3 w-3 translate-x-px fill-current" aria-hidden="true" />
            </span>
          </span>
        ) : null}
      </button>
      <div className="min-w-0 py-2">
        <h3 className="text-[15px] font-semibold text-[#111111]">{card.title}</h3>
        <div className="mt-0.5 text-[13px] leading-[1.45] text-[#697386]">
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
      {lightbox && <MediaLightbox title={card.title} content={lightbox} onClose={() => setLightbox(null)} />}
    </article>
  )
}
