'use client'

import { useMemo, useState, type RefObject } from 'react'
import { motion } from 'framer-motion'
import { haversineMeters } from '@/features/transport/lib/geo'
import { capitalizeFirst } from '@/shared/lib/utils'
import type { GuidePoi } from '@/features/guide-app/types'
import { getFavoriteBentoVariant } from '@/features/guide-app/lib/favorite-bento'
import { GuideFavoriteBentoCard } from './GuideFavoriteBentoCard'
import { GuideSearchEmpty, GuideSearchHeader } from './stay/GuideSearchHeader'
import { GuideLocationToggle } from './stay/GuideLocationToggle'
import { filterPoisByQuery, formatDistanceMeters, primaryTravel, type TravelTimeValues } from './stay/poi-search'
import { useUserLocation } from '@/features/geolocation/hooks/useUserLocation'

const DISTANCE_SOURCE_LABELS = {
  position: "Distances à vol d'oiseau depuis votre position",
  lodging: "Distances à vol d'oiseau depuis le logement",
} as const

export function GuideFavoritesPage({
  pois,
  city,
  origin = null,
  travelTimes = null,
  selectedCategorySlug,
  scrollContainerRef,
  onFilter,
  onSelectPoi,
  onShowOnMap,
}: {
  pois: GuidePoi[]
  city: string
  /** Coordonnées géocodées du logement ; null = aucune distance (spec 056 BR-01). */
  origin?: { latitude: number; longitude: number } | null
  /** Temps MapBox depuis le logement par POI (spec 057) ; null = indisponibles. */
  travelTimes?: Record<string, TravelTimeValues> | null
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
  const [query, setQuery] = useState('')
  const userLocation = useUserLocation()
  const position = userLocation.status === 'ready' ? userLocation.location : null
  const hasTravel = Boolean(travelTimes && Object.keys(travelTimes).length > 0)
  // Priorité (spec 057 / 003 BR-01a) : position GPS, puis temps depuis le logement,
  // puis vol d'oiseau depuis le logement ; rien sans origine fiable.
  const distanceSource: 'position' | 'travel' | 'lodging' | null =
    position ? 'position' : hasTravel ? 'travel' : origin ? 'lodging' : null
  const located = useMemo(
    () => pois.map((poi): GuidePoi => {
      if (position) {
        const meters = haversineMeters(position.latitude, position.longitude, poi.latitude, poi.longitude)
        return { ...poi, distanceLabel: `${formatDistanceMeters(meters)} de vous`, distanceMode: 'crow' }
      }
      if (hasTravel) {
        const travel = primaryTravel(travelTimes?.[poi.id])
        return travel ? { ...poi, distanceLabel: travel.label, distanceMode: travel.mode } : poi
      }
      if (origin) {
        const meters = haversineMeters(origin.latitude, origin.longitude, poi.latitude, poi.longitude)
        return { ...poi, distanceLabel: formatDistanceMeters(meters), distanceMode: 'crow' }
      }
      return poi
    }),
    [pois, origin, position, hasTravel, travelTimes],
  )
  const inCategory = selectedCategorySlug
    ? located.filter(poi => poi.category.slug === selectedCategorySlug)
    : located
  const visiblePois = filterPoisByQuery(inCategory, query)
  const originalPoi = (poi: GuidePoi) => pois.find(candidate => candidate.id === poi.id) ?? poi

  return (
    <div className="min-h-full bg-white px-3 pb-[120px] pt-5">
      <GuideSearchHeader
        city={city}
        query={query}
        onQueryChange={setQuery}
        locationControl={
          <GuideLocationToggle
            active={Boolean(position)}
            loading={userLocation.status === 'loading'}
            denied={userLocation.status === 'denied' || userLocation.status === 'unavailable'}
            onRequest={userLocation.requestLocation}
            onClear={userLocation.clearLocation}
          />
        }
      />

      <div
        className="sticky top-0 z-20 -mx-3 mt-3 flex gap-2 overflow-x-auto bg-white px-4 py-3 backdrop-blur-xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

      {distanceSource && distanceSource !== 'travel' ? (
        <p className="px-2 text-[12px] text-[#697386]">{DISTANCE_SOURCE_LABELS[distanceSource]}</p>
      ) : null}

      {visiblePois.length > 0 ? (
        <div data-testid="favorites-bento-grid" className="mt-3 grid grid-cols-2 gap-3">
          {visiblePois.map((poi, index) => (
            <GuideFavoriteBentoCard
              key={poi.id}
              poi={poi}
              variant={getFavoriteBentoVariant(index)}
              index={index}
              revealRoot={scrollContainerRef}
              onSelectPoi={selected => onSelectPoi(originalPoi(selected))}
              onShowOnMap={selected => onShowOnMap(originalPoi(selected))}
            />
          ))}
        </div>
      ) : query.trim() ? (
        <GuideSearchEmpty query={query} onClear={() => setQuery('')} />
      ) : null}
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
