'use client'

import { BookOpen, KeyRound, SquareCheck, Wifi } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { GuideLodgingVideoButton } from '@/features/guide-app/components/GuideLodgingVideoButton'
import { departureTasks } from '@/features/guide-app/lib/fixed-lodging-content'
import type { GuideLodging, GuidePoi, GuideView } from '@/features/guide-app/types'
import { haversineMeters } from '@/features/transport/lib/geo'
import { GuideFavoriteBentoCard, type BentoPoi } from '../GuideFavoriteBentoCard'
import {
  formatDistanceMeters,
  primaryTravel,
  STAY_HOME_EXCLUDED_CATEGORIES,
  type TravelTimeValues,
} from './poi-search'
import { formatFrenchPlaceReference } from '@/shared/lib/french-place'
import { formatGuideHour, STAY_SECTION_TITLE } from './stay-styles'

/** « Le 305 » → { lead: « Bienvenue au », name: « 305 » } (spec 054 AC-01-02). */
export function splitWelcome(name: string): { lead: string; name: string } {
  const reference = formatFrenchPlaceReference(name)
  const match = reference.match(/^(au|aux|à la|à l['’"]|à)\s*(.*)$/)
  if (!match) return { lead: 'Bienvenue', name }
  const elided = /['’"]$/.test(match[1])
  return {
    lead: `Bienvenue ${elided ? match[1].slice(0, -2) : match[1]}`.trim(),
    name: elided ? `${match[1].slice(-2)}${match[2]}` : match[2],
  }
}

/** Champs d'un lieu utiles au carrousel (lieux privés ou de démonstration). */
export type StayPoiCard = BentoPoi & Pick<GuidePoi, 'latitude' | 'longitude'> & { travel?: TravelTimeValues }

export function GuideStayHome<P extends StayPoiCard>({
  lodging,
  pois,
  departureDone,
  onNavigate,
  onOpenWifi,
  onOpenPoi,
  onShowPoiOnMap,
  travelTimes,
  transportEntry,
}: {
  lodging: GuideLodging
  pois: P[]
  departureDone: number
  onNavigate: (view: Extract<GuideView, 'arrival' | 'rules' | 'departure' | 'favorites'>) => void
  onOpenWifi: () => void
  onOpenPoi: (poi: P) => void
  onShowPoiOnMap?: (poi: P) => void
  /** Temps MapBox depuis le logement (spec 057) ; sinon `poi.travel` (démo). */
  travelTimes?: Record<string, TravelTimeValues> | null
  /** Spec 055 : ligne « Se déplacer » ou carte « Prochaines navettes ». */
  transportEntry?: React.ReactNode
}) {
  const welcome = splitWelcome(lodging.name)
  // Carrousel : sans urgences ni mobilité, avec un temps réel ou à défaut une
  // distance à vol d'oiseau depuis un logement localisé (specs 054 / 057).
  const featured = pois
    .filter(poi => !STAY_HOME_EXCLUDED_CATEGORIES.has(poi.category.slug))
    .map(poi => {
      const travel = primaryTravel(travelTimes?.[poi.id] ?? poi.travel)
      if (travel) return { poi, display: { ...poi, distanceLabel: travel.label, distanceMode: travel.mode } }
      if (lodging.locationPrecise) {
        const meters = haversineMeters(lodging.latitude, lodging.longitude, poi.latitude, poi.longitude)
        return { poi, display: { ...poi, distanceLabel: formatDistanceMeters(meters), distanceMode: 'crow' as const } }
      }
      return { poi, display: poi }
    })
  const departureTotal = departureTasks(lodging.departureInstructions).length
  const stats = [
    lodging.stats.guests !== null ? { value: String(lodging.stats.guests), label: 'Voyageurs' } : null,
    lodging.stats.bedrooms !== null ? { value: String(lodging.stats.bedrooms), label: 'Chambres' } : null,
    lodging.stats.surfaceM2 !== null ? { value: `${lodging.stats.surfaceM2} m²`, label: 'Surface' } : null,
  ].filter((stat): stat is { value: string; label: string } => stat !== null)

  return (
    <div className="min-h-full bg-[#F6F6F4] pb-[120px]">
      <section className="relative mx-5 mt-4 h-[300px] overflow-hidden rounded-[28px] bg-[#111111] text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={lodging.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,17,17,0.1),rgba(17,17,17,0.88)_72%)]" />
        <span className="absolute left-5 top-6 rounded-full bg-[#DB2777] px-3 py-[7px] text-[11px] font-semibold uppercase tracking-[0.12em]">
          Votre guide de séjour
        </span>
        <div className={`absolute inset-x-5 ${stats.length > 0 ? 'bottom-[96px]' : 'bottom-6'}`}>
          <h1>
            <span className="block text-[13px] font-normal">{welcome.lead}</span>{' '}
            <span className="mt-1 block font-serif text-[52px] font-medium italic leading-[0.95] tracking-[-0.04em]">
              {welcome.name}
            </span>
          </h1>
          <p className="mt-2 text-[13px] text-white/80">{lodging.city}</p>
        </div>
        {stats.length > 0 && (
          <dl
            data-testid="guide-stay-stats"
            className="absolute inset-x-[14px] bottom-[14px] grid gap-2"
            style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
          >
            {stats.map(stat => (
              <div key={stat.label} className="flex flex-col-reverse rounded-2xl bg-[rgba(17,17,17,0.9)] p-3">
                <dt className="text-[11px] text-white/70">{stat.label}</dt>
                <dd className="text-[18px] font-semibold">{stat.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="mx-5 mt-[14px] grid grid-cols-2 gap-2.5">
        <StayTile
          icon={KeyRound}
          title="Arrivée"
          subtitle={`Dès ${formatGuideHour(lodging.checkIn)}`}
          dark
          onClick={() => onNavigate('arrival')}
        />
        <StayTile icon={Wifi} title="Wi-Fi" subtitle="Copier le mot de passe" onClick={onOpenWifi} />
        <StayTile
          icon={BookOpen}
          title="Guide logement"
          subtitle="Équipements et règles"
          onClick={() => onNavigate('rules')}
        />
        <StayTile
          icon={SquareCheck}
          title="Départ"
          subtitle={`${departureDone} sur ${departureTotal} faits`}
          onClick={() => onNavigate('departure')}
        />
      </section>

      {/* Vidéo de présentation saisie par l'Owner (spec 044), conservée sous les tuiles. */}
      {lodging.presentationVideoUrl ? (
        <div className="mx-5 mt-2.5">
          <GuideLodgingVideoButton url={lodging.presentationVideoUrl} />
        </div>
      ) : null}

      {transportEntry ? <div className="mx-5 mt-2.5">{transportEntry}</div> : null}

      {featured.length > 0 && (
        <section aria-labelledby="stay-featured-title" className="mt-[26px]">
          <div className="mx-5 flex items-baseline justify-between">
            <h2 id="stay-featured-title" className={STAY_SECTION_TITLE}>Nos coups de cœur</h2>
            <button
              type="button"
              onClick={() => onNavigate('favorites')}
              className="min-h-11 text-[13px] font-semibold text-[#DB2777]"
            >
              Tout voir
            </button>
          </div>
          <div className="no-scrollbar mt-2 flex snap-x gap-3 overflow-x-auto px-5 pb-1">
            {featured.map(({ poi, display }) => (
              <div key={poi.id} className="w-[200px] shrink-0 snap-start">
                <GuideFavoriteBentoCard
                  poi={display}
                  variant="compact"
                  onSelectPoi={() => onOpenPoi(poi)}
                  onShowOnMap={() => (onShowPoiOnMap ? onShowPoiOnMap(poi) : onOpenPoi(poi))}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function StayTile({
  icon: Icon,
  title,
  subtitle,
  dark = false,
  onClick,
}: {
  icon: LucideIcon
  title: string
  subtitle: string
  dark?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${title} — ${subtitle}`}
      className={`flex min-h-[112px] flex-col justify-between rounded-[18px] p-4 text-left transition-transform active:scale-[0.99] ${
        dark ? 'bg-[#111111] text-white' : 'bg-white text-[#111111] shadow-[0_1px_2px_rgba(17,17,17,0.06)]'
      }`}
    >
      <Icon className={`h-[22px] w-[22px] ${dark ? 'text-white' : 'text-[#DB2777]'}`} strokeWidth={1.8} aria-hidden="true" />
      <span className="mt-4 block">
        <span className="block text-[15px] font-semibold">{title}</span>
        <span className={`mt-0.5 block text-[12px] ${dark ? 'text-white/70' : 'text-[#697386]'}`}>{subtitle}</span>
      </span>
    </button>
  )
}
