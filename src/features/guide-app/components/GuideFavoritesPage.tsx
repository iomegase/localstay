'use client'

import type { RefObject } from 'react'
import { motion } from 'framer-motion'
import { capitalizeFirst } from '@/shared/lib/utils'
import type { GuidePoi } from '@/features/guide-app/types'
import { getFavoriteBentoVariant } from '@/features/guide-app/lib/favorite-bento'
import { GuideFavoriteBentoCard } from './GuideFavoriteBentoCard'

export function GuideFavoritesPage({
  pois,
  selectedCategorySlug,
  scrollContainerRef,
  onFilter,
  onSelectPoi,
  onShowOnMap,
}: {
  pois: GuidePoi[]
  selectedCategorySlug: string | null
  scrollContainerRef?: RefObject<HTMLElement | null>
  onFilter: (categorySlug: string | null) => void
  onSelectPoi: (poi: GuidePoi) => void
  onShowOnMap: (poi: GuidePoi) => void
}) {
  const categories = Array.from(
    new globalThis.Map(
      pois.map(poi => [poi.category.slug, poi.category]),
    ).values(),
  )
  const visiblePois = selectedCategorySlug
    ? pois.filter(poi => poi.category.slug === selectedCategorySlug)
    : pois

  return (
    <div className="px-3 pb-24 pt-5">
      <div className="px-2">
        <h1 className="text-[30px] font-semibold leading-none tracking-[-0.045em] text-slate-900">
          Nos coups de cœur
        </h1>
      </div>

      <div
        className="sticky top-0 z-20 -mx-3 mt-5 flex gap-2 overflow-x-auto bg-white/95 px-4 py-3 backdrop-blur-xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Filtrer les catégories"
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

      <div data-testid="favorites-bento-grid" className="mt-3 grid grid-cols-2 gap-3">
        {visiblePois.map((poi, index) => (
          <GuideFavoriteBentoCard
            key={poi.id}
            poi={poi}
            variant={getFavoriteBentoVariant(index)}
            index={index}
            revealRoot={scrollContainerRef}
            onSelectPoi={onSelectPoi}
            onShowOnMap={onShowOnMap}
          />
        ))}
      </div>
    </div>
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
