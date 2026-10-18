'use client'

import { useState } from 'react'
import { Eye, Phone, Recycle } from 'lucide-react'
import { translateFixedRule } from '@/features/guide-app/lib/fixed-lodging-content'
import { inlineMarkdown } from '@/features/guide-app/lib/inline-markdown'
import type { GuideLodging, GuidePracticalCard, GuideThingToKnow } from '@/features/guide-app/types'
import { extractYouTubeId, youTubeThumbnailUrl } from '@/shared/lib/youtube'
import { GuideDarkMarkdown } from '../GuideDarkMarkdown'
import { MediaLightbox, type LightboxContent } from '../MediaLightbox'
import { GuideStayScreen } from './GuideStayScreen'
import { STAY_CARD } from './stay-styles'
import { recyclingMapsHref } from '@/features/guide-app/lib/recycling-maps'
import { useGuideMessages } from '@/features/guide-i18n/components/GuideI18nContext'
import { formatPhone, phoneHref } from '@/shared/lib/phone'

const SECTION_PILL = 'inline-flex w-fit rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-semibold uppercase leading-none tracking-[0.08em] text-slate-900'

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
  const equipment = lodging.practicalCards.filter(card => card.icon !== 'recycle')
  const recycling = lodging.practicalCards.filter(card => card.icon === 'recycle')
  const thingsToKnow = lodging.thingsToKnow ?? []

  return (
    <GuideStayScreen title={m.houseGuide.title} onBack={onBack}>
      {/* Spec 054 amendement 2026-10-18 : Règlement → Point de tri → Choses à savoir → Équipements. */}
      {lodging.houseRules.length > 0 && (
        <section>
          <h2 className={SECTION_PILL}>{m.houseGuide.rules}</h2>
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
        <h2 className={SECTION_PILL}>{m.houseGuide.recycling}</h2>
        <div className="mt-3 grid gap-2.5">
          {recycling.map(card => <EquipmentCard key={card.id} card={card} />)}
          <div className="flex min-h-[76px] w-full items-center gap-2.5 rounded-[20px] bg-white p-3 text-left tracking-[-0.025em] shadow-md transition-[transform,box-shadow] duration-200 hover:shadow-sm">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-slate-100 text-black">
              <Recycle className="h-7 w-7 stroke-1" strokeWidth={1} aria-hidden="true" />
            </span>
            <p className="min-w-0 flex-1 text-[15px] font-semibold text-[#111111]">{m.houseGuide.findRecycling}</p>
            {!demo && (
              <a
                href={recyclingMapsHref(lodging.trashLocation, lodging.city)}
                target="_blank"
                rel="noreferrer"
                aria-label={m.address.openMaps}
                className="-mr-3 grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#BE185D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#BE185D]"
              >
                <Eye strokeWidth={1} className="h-5 w-5 stroke-1" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Spec 099 AC-02-01 : entre « Point de tri » et « Équipements » (amendement 2026-10-18), absente sans carte. */}
      {thingsToKnow.length > 0 && (
        <section className="mt-[26px]">
          <h2 className={SECTION_PILL}>{m.houseGuide.thingsToKnow}</h2>
          <div className="mt-3 grid gap-2.5">
            {thingsToKnow.map(item => <ThingToKnowCard key={item.id} item={item} />)}
          </div>
        </section>
      )}

      {equipment.length > 0 && (
        <section className="mt-[26px]">
          <h2 className={SECTION_PILL}>{m.houseGuide.equipment}</h2>
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
 * Spec 099 AC-02-02/03 : carte accordéon — vignette (zoom au toucher) + titre ;
 * dépliée, la description puis les autres photos.
 */
function ThingToKnowCard({ item }: { item: GuideThingToKnow }) {
  const m = useGuideMessages()
  const [open, setOpen] = useState(false)
  const [lightbox, setLightbox] = useState<LightboxContent | null>(null)
  const panelId = `guide-thing-${item.id}`
  const openPhoto = (index: number) => setLightbox({ kind: 'photos', photos: item.photos, startIndex: index })
  const otherPhotos = item.photos.slice(1)
  const hasPanel = item.description.trim().length > 0 || otherPhotos.length > 0

  return (
    <article data-testid="guide-thing-to-know" className={STAY_CARD}>
      <div className="flex items-center gap-3 p-3 pr-4">
        {item.photos[0] ? (
          <button
            type="button"
            aria-label={m.media.photoOf(item.title, 1)}
            onClick={() => openPhoto(0)}
            className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-xl bg-[#E8E6E2]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.photos[0]} alt="" className="h-full w-full object-cover" />
          </button>
        ) : null}
        <button
          type="button"
          aria-expanded={hasPanel ? open : undefined}
          aria-controls={hasPanel ? panelId : undefined}
          disabled={!hasPanel}
          onClick={() => setOpen(current => !current)}
          className={`flex min-h-14 min-w-0 flex-1 items-center justify-between gap-3 text-left text-[15px] font-semibold text-[#111111] ${item.photos[0] ? '' : 'pl-2.5'}`}
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
          {otherPhotos.length > 0 ? (
            <div className="grid grid-cols-4 gap-1.5">
              {otherPhotos.map((photo, index) => (
                <button
                  key={`${photo}-${index}`}
                  type="button"
                  aria-label={m.media.photoOf(item.title, index + 2)}
                  onClick={() => openPhoto(index + 1)}
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
