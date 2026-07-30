'use client'

import { useState, type RefObject } from 'react'
import { motion } from 'framer-motion'
import { Clock3, Map as MapIcon, MapPin } from 'lucide-react'
import { getGuidePoiHeroImage } from '@/features/guide-app/lib/poi-image'
import type { FavoriteBentoVariant } from '@/features/guide-app/lib/favorite-bento'
import type { GuidePoi } from '@/features/guide-app/types'

type Props = {
  poi: GuidePoi
  variant: FavoriteBentoVariant
  index?: number
  revealRoot?: RefObject<HTMLElement | null>
  onSelectPoi: (poi: GuidePoi) => void
  onShowOnMap: (poi: GuidePoi) => void
}

/**
 * Carte bento d'un coup de cœur du GuideApp. Reproduit le langage visuel des
 * cartes illustrées privées (image plein cadre, dégradé sombre, méta superposée)
 * pour le type `GuidePoi`, sans importer de `Link`, de type Prisma ni de route
 * privée : le clic principal appelle `onSelectPoi`, l'action Carte `onShowOnMap`.
 */
export function GuideFavoriteBentoCard({
  poi,
  variant,
  index = 0,
  revealRoot,
  onSelectPoi,
  onShowOnMap,
}: Props) {
  const heroSrc = getGuidePoiHeroImage({ categorySlug: poi.category.slug, photos: poi.photos })
  const fallbackSrc = getGuidePoiHeroImage({ categorySlug: poi.category.slug, photos: [] })
  const [src, setSrc] = useState(heroSrc)

  const isBig = variant === 'big'
  // Les durées vagues « Demi-journée » ne sont pas affichées sur les cartes.
  const durationLabel = poi.durationLabel && poi.durationLabel !== 'Demi-journée' ? poi.durationLabel : null

  return (
    <motion.article
      data-testid="favorite-bento-card"
      data-variant={variant}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ root: revealRoot, amount: 0.2, once: false, margin: '0px 0px -8% 0px' }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 28,
        delay: (index % 2) * 0.06,
      }}
      className={`group relative aspect-square overflow-hidden bg-charcoal shadow-[0_10px_28px_rgba(0,0,0,0.10)] ${
        isBig ? 'col-span-2 rounded-[2rem]' : 'rounded-[1.75rem]'
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
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
      />

      {/* Statut d'ouverture (si le lieu a des horaires) */}
      {typeof poi.isOpenNow === 'boolean' && (
        <span
          data-testid="favorite-open-status"
          className={`absolute left-3 top-3 z-[1] inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-white shadow-sm ${
            poi.isOpenNow ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {poi.isOpenNow ? 'Ouvert' : 'Fermé'}
        </span>
      )}

      {/* Action principale : couvre toute la carte, sous le contenu et l'action Carte */}
      <button
        type="button"
        aria-label={`Ouvrir ${poi.name}`}
        onClick={() => onSelectPoi(poi)}
        className="absolute inset-0 z-0 h-full w-full"
      />

      {/* Contenu superposé, non interactif (les clics tombent sur l'action principale) */}
      <div className={`pointer-events-none absolute inset-0 z-[1] flex flex-col justify-end text-white ${isBig ? 'p-5' : 'p-4'}`}>
        <h3 className={`uppercase leading-none ${isBig ? 'text-2xl' : 'text-sm leading-tight'}`}>
          {poi.name}
        </h3>

        {(poi.distanceLabel || durationLabel) && (
          <div className={`mt-2 flex items-center gap-3 text-white/80 ${isBig ? 'text-[11px]' : 'text-[9px]'}`}>
            {poi.distanceLabel && (
              <span className="flex items-center gap-1">
                <MapPin className={isBig ? 'h-3.5 w-3.5' : 'h-3 w-3'} />
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
        aria-label={`Voir ${poi.name} sur la carte`}
        onClick={() => onShowOnMap(poi)}
        className="absolute right-3 top-3 z-10 inline-flex items-center justify-center rounded-full bg-black/55 p-2 text-white backdrop-blur transition hover:bg-black/75"
      >
        <MapIcon className="h-4 w-4" />
      </button>
    </motion.article>
  )
}
