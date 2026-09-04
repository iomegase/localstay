'use client'

import { motion } from 'framer-motion'
import { Clock3, Map as MapIcon, MapPin } from 'lucide-react'
import { useMemo } from 'react'
import type { DemoPoi } from '@/features/guide-demo/types'
import { DemoPoiImage } from './DemoPoiImage'

function capitalizeFirst(value: string) {
  return value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value
}

type DemoFavoritesViewProps = {
  pois: readonly DemoPoi[]
  selectedCategorySlug: string | null
  onFilter: (categorySlug: string | null) => void
  onOpenPoi: (poi: DemoPoi) => void
  onShowOnMap: (poi: DemoPoi) => void
}

export function DemoFavoritesView({
  pois,
  selectedCategorySlug,
  onFilter,
  onOpenPoi,
  onShowOnMap,
}: DemoFavoritesViewProps) {
  const categories = useMemo(
    () =>
      Array.from(
        new Map(pois.map(poi => [poi.category.slug, poi.category])).values(),
      ),
    [pois],
  )
  const visiblePois = selectedCategorySlug
    ? pois.filter(poi => poi.category.slug === selectedCategorySlug)
    : pois

  return (
    <section className="min-h-full bg-white px-3 pb-24 pt-5">
      <div className="px-2">
        <h1
          data-demo-view-heading="true"
          tabIndex={-1}
          className="text-[30px] font-semibold leading-none tracking-[-0.045em] text-slate-900"
        >
          Nos coups de cœur
        </h1>
      </div>

      <div
        role="group"
        aria-label="Filtrer les catégories"
        className="sticky top-0 z-20 -mx-3 mt-5 flex gap-2 overflow-x-auto bg-white/95 px-4 py-3 backdrop-blur-xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <FilterButton
          label="Tous"
          active={selectedCategorySlug === null}
          onClick={() => onFilter(null)}
        />
        {categories.map(category => (
          <FilterButton
            key={category.slug}
            label={capitalizeFirst(category.name)}
            active={selectedCategorySlug === category.slug}
            onClick={() => onFilter(category.slug)}
          />
        ))}
      </div>

      {visiblePois.length > 0 ? (
        <div
          data-testid="favorites-bento-grid"
          className="mt-3 grid grid-cols-2 gap-3"
        >
          {visiblePois.map((poi, index) => (
            <DemoFavoriteBentoCard
              key={poi.id}
              poi={poi}
              variant={index === 0 ? 'big' : 'compact'}
              onOpenPoi={onOpenPoi}
              onShowOnMap={onShowOnMap}
            />
          ))}
        </div>
      ) : (
        <p className="px-2 pt-10 text-sm text-slate-600">
          Aucun coup de cœur dans cette catégorie.
        </p>
      )}
    </section>
  )
}

function DemoFavoriteBentoCard({
  poi,
  variant,
  onOpenPoi,
  onShowOnMap,
}: {
  poi: DemoPoi
  variant: 'big' | 'compact'
  onOpenPoi: (poi: DemoPoi) => void
  onShowOnMap: (poi: DemoPoi) => void
}) {
  const isBig = variant === 'big'
  const durationLabel =
    poi.durationLabel && poi.durationLabel !== 'Demi-journée'
      ? poi.durationLabel
      : null

  return (
    <article
      data-testid="favorite-bento-card"
      data-variant={variant}
      className={`group relative aspect-square overflow-hidden bg-charcoal shadow-[0_10px_28px_rgba(0,0,0,0.10)] ${
        isBig ? 'col-span-2 rounded-[2rem]' : 'rounded-[1.75rem]'
      }`}
    >
      <DemoPoiImage
        primarySrc={poi.photos[0]}
        category={poi.category}
        name={poi.name}
        decorative
        loading={isBig ? 'eager' : 'lazy'}
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
      />

      {typeof poi.isOpenNow === 'boolean' ? (
        <span
          data-testid="favorite-open-status"
          className={`absolute left-3 top-3 z-[1] inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-white shadow-sm ${
            poi.isOpenNow ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {poi.isOpenNow ? 'Ouvert' : 'Fermé'}
        </span>
      ) : null}

      <button
        type="button"
        aria-label={`Ouvrir ${poi.name}`}
        onClick={() => onOpenPoi(poi)}
        className="absolute inset-0 z-0 h-full w-full"
      />

      <div
        className={`pointer-events-none absolute inset-0 z-[1] flex flex-col justify-end text-white ${
          isBig ? 'p-5' : 'p-4'
        }`}
      >
        <h2
          className={`mb-2.5 max-w-[62%] font-semibold uppercase leading-none tracking-[0.4px] ${
            isBig ? 'text-2xl' : 'text-sm leading-tight'
          }`}
        >
          {capitalizeFirst(poi.name)}
        </h2>

        {poi.distanceLabel || durationLabel ? (
          <div
            className={`mt-2 flex items-center gap-3 text-white/80 ${
              isBig ? 'text-[11px]' : 'text-[9px]'
            }`}
          >
            {poi.distanceLabel ? (
              <span className="flex items-center gap-1">
                <MapPin className={isBig ? 'h-3.5 w-3.5' : 'h-3 w-3'} />
                {poi.distanceLabel}
              </span>
            ) : null}
            {durationLabel ? (
              <span className="flex items-center gap-1">
                <Clock3 className={isBig ? 'h-3.5 w-3.5' : 'h-3 w-3'} />
                {durationLabel}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        aria-label={`Afficher ${poi.name} sur la carte`}
        onClick={() => onShowOnMap(poi)}
        className="absolute right-3 top-3 z-10 inline-flex items-center justify-center rounded-full bg-black/55 p-2 text-white backdrop-blur transition hover:bg-black/75"
      >
        <MapIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </article>
  )
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`shrink-0 rounded-full border-none px-4 py-2 text-[10px] font-bold tracking-[0.4px] shadow-md transition-shadow duration-200 ${
        active
          ? 'bg-slate-900 text-white'
          : 'bg-white text-slate-600 hover:text-slate-900 hover:shadow-lg'
      }`}
    >
      {label}
    </motion.button>
  )
}
