'use client'

import { useState, type RefObject } from 'react'
import { Car, Clock3, Footprints, Map as MapIcon, MapPin } from 'lucide-react'
import { getGuidePoiHeroImage } from '@/features/guide-app/lib/poi-image'
import { capitalizeFirst } from '@/shared/lib/utils'
import type { FavoriteBentoVariant } from '@/features/guide-app/lib/favorite-bento'
import type { GuidePoi } from '@/features/guide-app/types'
import { useGuideMessages } from '@/features/guide-i18n/components/GuideI18nContext'

/** Champs affichés par la carte (lieux privés ou de démonstration). */
export type BentoPoi = Pick<
  GuidePoi,
  'id' | 'name' | 'category' | 'photos' | 'isOpenNow' | 'distanceLabel' | 'distanceMode' | 'durationLabel'
>

type Props<P extends BentoPoi> = {
  poi: P
  variant: FavoriteBentoVariant
  index?: number
  revealRoot?: RefObject<HTMLElement | null>
  onSelectPoi: (poi: P) => void
  onShowOnMap: (poi: P) => void
}

/**
 * Carte bento d'un coup de cœur du GuideApp. Reproduit le langage visuel des
 * cartes illustrées privées (image plein cadre, dégradé sombre, méta superposée)
 * pour le type `GuidePoi`, sans importer de `Link`, de type Prisma ni de route
 * privée : le clic principal appelle `onSelectPoi`, l'action Carte `onShowOnMap`.
 */
export function GuideFavoriteBentoCard<P extends BentoPoi>({
  poi,
  variant,
  onSelectPoi,
  onShowOnMap,
}: Props<P>) {
  const m = useGuideMessages()
  const heroSrc = getGuidePoiHeroImage({ categorySlug: poi.category.slug, photos: poi.photos })
  const fallbackSrc = getGuidePoiHeroImage({ categorySlug: poi.category.slug, photos: [] })
  const [src, setSrc] = useState(heroSrc)

  const isBig = variant === 'big'
  // Les durées vagues « Demi-journée » ne sont pas affichées sur les cartes.
  const durationLabel = poi.durationLabel && poi.durationLabel !== 'Demi-journée' ? poi.durationLabel : null

  return (
    <article
      data-testid="favorite-bento-card"
      data-variant={variant}
      className={`group relative aspect-square overflow-hidden ${
        isBig
          ? 'col-span-2 rounded-[2rem] bg-charcoal '
          : 'rounded-[1.75rem]'
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- image distante chargée directement pour éviter le blocage NAT64 de l'optimiseur Next.js */}
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => {
          if (src !== fallbackSrc) setSrc(fallbackSrc)
        }}
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/5 to-transparent"
      />

      {/* Statut d'ouverture (si le lieu a des horaires) */}
      {typeof poi.isOpenNow === 'boolean' && (
        <span
          data-testid="favorite-open-status"
          className={`absolute left-3 top-3 z-[1] inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-white shadow-sm ${
            poi.isOpenNow ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {poi.isOpenNow ? m.poi.open : m.poi.closed}
        </span>
      )}

      {/* Action principale : couvre toute la carte, sous le contenu et l'action Carte */}
      <button
        type="button"
        aria-label={m.card.open(poi.name)}
        onClick={() => onSelectPoi(poi)}
        className="absolute inset-0 z-0 h-full w-full"
      />

      {/* Contenu superposé, non interactif (les clics tombent sur l'action principale) */}
      <div className={`pointer-events-none absolute inset-0 z-[1] flex flex-col justify-end text-white ${isBig ? 'p-5' : 'p-4'}`}>
        <h3
          className={`mb-2.5 max-w-[62%] font-semibold uppercase leading-none tracking-[0.4px] ${
            isBig ? 'text-2xl' : 'text-sm leading-tight'
          }`}
        >
          {capitalizeFirst(poi.name)}
        </h3>

        {(poi.distanceLabel || durationLabel) && (
          <div className={`mt-2 flex items-center gap-3 text-white/80 ${isBig ? 'text-[11px]' : 'text-[9px]'}`}>
            {poi.distanceLabel && (
              <span className="flex items-center gap-1">
                <DistanceIcon mode={poi.distanceMode} className={isBig ? 'h-3.5 w-3.5' : 'h-3 w-3'} />
                {poi.distanceLabel}
              </span>
            )}
            {durationLabel && (
              <span className="flex items-center gap-1">
                <Clock3 className={isBig ? 'h-3.5 w-3.5' : 'h-3 w-3'} />
                {durationLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Carte distincte (icône seule), au-dessus de l'action principale */}
      <button
        type="button"
        aria-label={m.card.showOnMap(poi.name)}
        onClick={() => onShowOnMap(poi)}
        className="absolute right-3 top-3 z-10 inline-flex items-center justify-center rounded-full bg-black/55 p-2 text-white backdrop-blur transition hover:bg-black/75"
      >
        <MapIcon className="h-4 w-4" />
      </button>
    </article>
  )
}

/** Icône du libellé de distance : marche, voiture (temps MapBox) ou vol d'oiseau (spec 057). */
function DistanceIcon({ mode, className }: { mode: GuidePoi['distanceMode']; className: string }) {
  if (mode === 'walking') {
    return <span role="img" aria-label="À pied"><Footprints className={className} aria-hidden="true" /></span>
  }
  if (mode === 'driving') {
    return <span role="img" aria-label="En voiture"><Car className={className} aria-hidden="true" /></span>
  }
  return <MapPin className={className} aria-hidden="true" />
}
