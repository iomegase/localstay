'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown, ExternalLink, MapPin } from 'lucide-react'
import { GuideStayScreen } from '@/features/guide-app/components/stay/GuideStayScreen'
import { STAY_CARD } from '@/features/guide-app/components/stay/stay-styles'
import type { GuideLodging, GuideTransportCard } from '@/features/guide-app/types'
import { FacilibusDetails } from './FacilibusDetails'

const FALLBACK_IMAGES: [RegExp, string][] = [
  [/tramway/i, '/fallback/fallback-tramway.png'],
  [/taxi/i, '/fallback/fallback-taxi.png'],
  [/v[ée]lo/i, '/fallback/velo-bar.png'],
  [/t[ée]l[ée]cabine|vall[ée]en/i, '/fallback/fallback-telecabines.png'],
]

function cardImage(card: GuideTransportCard): string | null {
  return card.image_url || FALLBACK_IMAGES.find(([pattern]) => pattern.test(card.title))?.[1] || null
}

function TransportAccordionCard({ id, title, body, tag, isFree, image, open, onToggle, children }: {
  id: string; title: string; body: string; tag?: string | null; isFree?: boolean; image: string | null
  open: boolean; onToggle: () => void; children: ReactNode
}) {
  const panelId = `transport-panel-${id}`
  return (
    <article className={`${STAY_CARD} overflow-hidden`}>
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={panelId}
        className="flex w-full items-center gap-3 p-2.5 pr-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DB2777]">
        <span className="grid h-[76px] w-[76px] shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 text-slate-500">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : <MapPin className="h-6 w-6" aria-hidden="true" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-[15px] font-semibold leading-tight text-[#111111]">{title}</span>
            {tag ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{tag}</span> : null}
            {isFree ? <span className="rounded-full bg-[#FF6B00] px-2 py-0.5 text-[10px] font-bold text-white">Gratuit</span> : null}
          </span>
          {body.trim() ? <span className="mt-1 line-clamp-2 block text-[13px] leading-[1.4] text-[#697386]">{body}</span> : null}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#DB2777] transition-transform duration-300 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <div id={panelId} aria-hidden={!open} inert={!open}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-slate-100 px-4 pb-4 pt-3">{children}</div>
        </div>
      </div>
    </article>
  )
}

/** Cartes de transport compactes ; les détails et actions restent dans le guide. */
export function GuideTransportView({ lodging, onBack, onOpenPoi }: {
  lodging: Pick<GuideLodging, 'facilibus' | 'transportCards' | 'latitude' | 'longitude' | 'locationPrecise'>
  onBack: () => void
  onOpenPoi?: (poiId: string) => void
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [facilibusLoaded, setFacilibusLoaded] = useState(false)
  const shuttleCard = lodging.transportCards.find(card => card.service_key === 'facilibus')
  return (
    <GuideStayScreen title="Se déplacer"
      subtitle="Laissez la voiture de côté, la vallée se découvre facilement en transports en commun."
      onBack={onBack}>
      <div className="grid gap-2.5">
        {lodging.facilibus ? (
          <TransportAccordionCard id="facilibus" title={shuttleCard?.title || 'Navette gratuite'}
            tag={shuttleCard?.tag?.toLowerCase() === 'facilibus' ? null : shuttleCard?.tag}
            isFree={shuttleCard ? shuttleCard.is_free : true}
            body={shuttleCard ? shuttleCard.body : 'Saint-Gervais ↔ Saint-Nicolas-de-Véroce · horaires et prochains passages'}
            image={shuttleCard?.image_url || '/fallback/fallback-bus.png'} open={openId === 'facilibus'}
            onToggle={() => {
              setFacilibusLoaded(true)
              setOpenId(current => current === 'facilibus' ? null : 'facilibus')
            }}>
            {shuttleCard?.details ? <p className="mb-4 whitespace-pre-line text-[13px] leading-relaxed text-[#697386]">{shuttleCard.details}</p> : null}
            {facilibusLoaded ? <FacilibusDetails lodging={lodging} /> : null}
            {(shuttleCard?.poi_id || shuttleCard?.external_url) ? <div className="mt-3 flex flex-wrap gap-2">
              {shuttleCard?.poi_id && onOpenPoi ? (
                <button type="button" onClick={() => onOpenPoi(shuttleCard.poi_id!)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-4 text-[12px] font-semibold text-slate-800">
                  <MapPin className="h-4 w-4" aria-hidden="true" /> Voir la destination
                </button>
              ) : null}
              {shuttleCard?.external_url ? (
                <a href={shuttleCard.external_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-4 text-[12px] font-semibold text-slate-800">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" /> {shuttleCard.cta_label || 'En savoir plus'}
                </a>
              ) : null}
            </div> : null}
          </TransportAccordionCard>
        ) : null}
        {lodging.transportCards.filter(card => card.service_key !== 'facilibus').map(card => (
          <TransportAccordionCard key={card.id} id={card.id} title={card.title} body={card.body}
            tag={card.tag} isFree={card.is_free} image={cardImage(card)} open={openId === card.id}
            onToggle={() => setOpenId(current => current === card.id ? null : card.id)}>
            {(card.details || card.body) ? <p className="whitespace-pre-line text-[13px] leading-relaxed text-[#697386]">{card.details || card.body}</p> : null}
            {(card.poi_id || card.external_url) ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {card.poi_id && onOpenPoi ? (
                  <button type="button" onClick={() => onOpenPoi(card.poi_id!)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#111827] px-4 text-[12px] font-semibold text-white">
                    <MapPin className="h-4 w-4" aria-hidden="true" /> Voir la destination
                  </button>
                ) : null}
                {card.external_url ? (
                  <a href={card.external_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-800">
                    <ExternalLink className="h-4 w-4" aria-hidden="true" /> {card.cta_label || 'En savoir plus'}
                  </a>
                ) : null}
              </div>
            ) : null}
          </TransportAccordionCard>
        ))}
      </div>
    </GuideStayScreen>
  )
}
