'use client'

import { useState } from 'react'
import { Lightbulb, Phone, Recycle } from 'lucide-react'
import { translateFixedRule } from '@/features/guide-app/lib/fixed-lodging-content'
import { inlineMarkdown } from '@/features/guide-app/lib/inline-markdown'
import type { GuideLodging, GuidePracticalCard, GuideThingToKnow } from '@/features/guide-app/types'
import { extractYouTubeId, youTubeThumbnailUrl } from '@/shared/lib/youtube'
import { GuideDarkMarkdown } from '../GuideDarkMarkdown'
import { MediaLightbox, type LightboxContent } from '../MediaLightbox'
import { GuideStayScreen } from './GuideStayScreen'
import { STAY_CARD, STAY_SECTION_PILL } from './stay-styles'
import { recyclingMapsHref } from '@/features/guide-app/lib/recycling-maps'
import { useGuideMessages } from '@/features/guide-i18n/components/GuideI18nContext'
import { formatPhone, phoneHref } from '@/shared/lib/phone'

const RECYCLING_CARD = 'flex min-h-[76px] w-full items-center gap-2.5 rounded-[20px] bg-white p-3 pr-4 text-left tracking-[-0.025em] shadow-md transition-[transform,box-shadow] duration-200 hover:shadow-sm'

/** Guide logement : règles en accordéon, point de tri, « Choses à savoir » (spec 099) puis équipements (spec 054 AC-04-01) + « Choses à savoir » (spec 099). */
export function GuideHouseGuide({
  lodging,
  onBack,
  demo = false,
}: {
  lodging: GuideLodging
  onBack: () => void
  demo?: boolean
}) {
  const m = useGuideMessages()
  const [openRule, setOpenRule] = useState<number | null>(null)
  // Spec 099 AC-02-02 (PO 2026-10-18) : une seule carte « Choses à savoir » ouverte à la fois.
  const [openThing, setOpenThing] = useState<string | null>(null)
  const equipment = lodging.practicalCards.filter(card => card.icon !== 'recycle')
  const recycling = lodging.practicalCards.filter(card => card.icon === 'recycle')
  const thingsToKnow = lodging.thingsToKnow ?? []

  return (
    <GuideStayScreen title={m.houseGuide.title} onBack={onBack}>
      {/* Spec 054 amendement 2026-10-18 : Règlement → Point de tri → Choses à savoir → Équipements. */}
      {lodging.houseRules.length > 0 && (
        <section>
          <h2 className={STAY_SECTION_PILL}>{m.houseGuide.rules}</h2>
          <div className={`${STAY_CARD} mt-3 divide-y divide-[rgba(17,17,17,0.08)]`}>
            {lodging.houseRules.map((rule, index) => {
              const open = openRule === index
              const panelId = `guide-rule-${index}`
              const translated = translateFixedRule(rule, index, m.fixed)
              return (
                <div key={`${rule}-${index}`}>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenRule(open ? null : index)}
                    className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left text-sm font-semibold text-[#111111]"
                  >
                    {translated.title}
                    <span aria-hidden="true" className="text-[20px] font-medium leading-none text-[#DB2777]">
                      {open ? '−' : '+'}
                    </span>
                  </button>
                  {open && (
                    <p id={panelId} className="px-4 pb-4 text-xs leading-[1.5] text-[#374151]">
                      {inlineMarkdown(translated.text)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="mt-[26px]">
        <h2 className={STAY_SECTION_PILL}>{m.houseGuide.recycling}</h2>
        <div className="mt-3 grid gap-2.5">
          {recycling.map(card => <EquipmentCard key={card.id} card={card} />)}
          {/* Toute la carte est le lien Maps, sans icône œil (PO 2026-10-18). */}
          {demo ? (
            <div className={RECYCLING_CARD}>
              <RecyclingCardContent label={m.houseGuide.findRecycling} />
            </div>
          ) : (
            <a
              href={recyclingMapsHref(lodging.trashLocation, lodging.city)}
              target="_blank"
              rel="noreferrer"
              className={`${RECYCLING_CARD} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BE185D]`}
            >
              <RecyclingCardContent label={m.houseGuide.findRecycling} />
            </a>
          )}
        </div>
      </section>

      {/* Spec 099 AC-02-01 : entre « Point de tri » et « Équipements » (amendement 2026-10-18), absente sans carte. */}
      {thingsToKnow.length > 0 && (
        <section className="mt-[26px]">
          <h2 className={STAY_SECTION_PILL}>{m.houseGuide.thingsToKnow}</h2>
          <div className="mt-3 grid gap-2.5">
            {thingsToKnow.map(item => (
              <ThingToKnowCard
                key={item.id}
                item={item}
                open={openThing === item.id}
                onToggle={() => setOpenThing(current => (current === item.id ? null : item.id))}
              />
            ))}
          </div>
        </section>
      )}

      {equipment.length > 0 && (
        <section className="mt-[26px]">
          <h2 className={STAY_SECTION_PILL}>{m.houseGuide.equipment}</h2>
          <div className="mt-3 grid gap-2.5">
            {equipment.map(card => (
              <EquipmentCard key={card.id} card={card} />
            ))}
          </div>
        </section>
      )}
    </GuideStayScreen>
  )
}

function RecyclingCardContent({ label }: { label: string }) {
  return (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] text-black">
        <Recycle className="h-7 w-7 stroke-1" strokeWidth={1} aria-hidden="true" />
      </span>
      <p className="min-w-0 flex-1 text-[15px] font-semibold text-[#111111]">{label}</p>
    </>
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
            href={phoneHref(card.phone)}
            className="mt-2 inline-flex min-h-11 items-center gap-2 text-[14px] font-semibold text-[#DB2777]"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {formatPhone(card.phone)}
          </a>
        ) : null}
      </div>
    </article>
  )
}

/**
 * Spec 099 AC-02-02/03 : carte accordéon — icône ampoule + titre ;
 * dépliée, la description puis toutes les photos (zoom au toucher).
 */
function ThingToKnowCard({
  item,
  open,
  onToggle,
}: {
  item: GuideThingToKnow
  open: boolean
  onToggle: () => void
}) {
  const m = useGuideMessages()
  const [lightbox, setLightbox] = useState<LightboxContent | null>(null)
  const panelId = `guide-thing-${item.id}`
  const openPhoto = (index: number) => setLightbox({ kind: 'photos', photos: item.photos, startIndex: index })
  const hasPanel = item.description.trim().length > 0 || item.photos.length > 0

  return (
    <article data-testid="guide-thing-to-know" className={STAY_CARD}>
      <div className="flex min-h-[76px] items-center gap-2.5 p-3 pr-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] text-black">
          <Lightbulb className="h-7 w-7 stroke-1" strokeWidth={1} aria-hidden="true" />
        </span>
        <button
          type="button"
          aria-expanded={hasPanel ? open : undefined}
          aria-controls={hasPanel ? panelId : undefined}
          disabled={!hasPanel}
          onClick={onToggle}
          className="flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 text-left text-[15px] font-semibold text-[#111111]"
        >
          <span className="min-w-0">{item.title}</span>
          {hasPanel ? (
            <span aria-hidden="true" className="text-[20px] font-medium leading-none text-[#DB2777]">
              {open ? '−' : '+'}
            </span>
          ) : null}
        </button>
      </div>
      {open && hasPanel ? (
        <div id={panelId} className="grid gap-3 px-4 pb-4">
          {item.description.trim() ? (
            <div className="text-[13px] leading-[1.5] text-[#374151]">
              <GuideDarkMarkdown source={item.description} />
            </div>
          ) : null}
          {item.photos.length > 0 ? (
            <div className="grid grid-cols-4 gap-1.5">
              {item.photos.map((photo, index) => (
                <button
                  key={`${photo}-${index}`}
                  type="button"
                  aria-label={m.media.photoOf(item.title, index + 1)}
                  onClick={() => openPhoto(index)}
                  className="aspect-square overflow-hidden rounded-[14px] bg-[#E8E6E2]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      {lightbox && <MediaLightbox title={item.title} content={lightbox} onClose={() => setLightbox(null)} />}
    </article>
  )
}
