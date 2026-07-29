'use client'

import { useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import {
  ArrowRight,
  ExternalLink,
  Home,
  MapPin,
  Navigation,
} from 'lucide-react'
import Map, {
  Marker,
  NavigationControl,
  type MapRef,
} from 'react-map-gl/mapbox'
import type {
  GuideLodging,
  GuidePoi,
} from '@/features/guide-app/types'

const markerClasses: Record<string, string> = {
  diner: 'bg-rose-600',
  alimentation: 'bg-amber-600',
  culture: 'bg-violet-600',
  activite: 'bg-sky-600',
  famille: 'bg-emerald-600',
  soin: 'bg-pink-700',
  rando: 'bg-lime-700',
}

export function GuideMapView({
  lodging,
  pois,
  selectedPoiId,
  selectedCategorySlug,
  onFilter,
  onSelectPoi,
  onOpenPoi,
}: {
  lodging: GuideLodging
  pois: GuidePoi[]
  selectedPoiId: string | null
  selectedCategorySlug: string | null
  onFilter: (categorySlug: string | null) => void
  onSelectPoi: (poi: GuidePoi) => void
  onOpenPoi: (poi: GuidePoi) => void
}) {
  const mapRef = useRef<MapRef | null>(null)
  const selectedPoi =
    pois.find(poi => poi.id === selectedPoiId) ?? null
  const visiblePois = selectedCategorySlug
    ? pois.filter(poi => poi.category.slug === selectedCategorySlug)
    : pois
  const categories = useMemo(
    () =>
      Array.from(
        new globalThis.Map(
          pois.map(poi => [poi.category.slug, poi.category]),
        ).values(),
      ),
    [pois],
  )

  useEffect(() => {
    if (!selectedPoi) return
    mapRef.current?.flyTo({
      center: [selectedPoi.longitude, selectedPoi.latitude],
      zoom: 14,
      duration: 600,
    })
  }, [selectedPoi])

  return (
    <div
      className="relative h-full min-h-[460px] w-full overflow-hidden bg-slate-100"
      data-testid="guide-map"
      data-selected-poi-id={selectedPoiId ?? ''}
    >
      <Map
        ref={mapRef}
        style={{ width: '100%', height: '100%' }}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          latitude: lodging.latitude,
          longitude: lodging.longitude,
          zoom: 12.2,
        }}
        mapStyle="mapbox://styles/mapbox/light-v11"
      >
        <NavigationControl position="top-right" showCompass={false} />
        <Marker
          longitude={lodging.longitude}
          latitude={lodging.latitude}
          anchor="bottom"
        >
          <span
            className="grid h-9 w-9 place-items-center rounded-full border-[3px] border-white bg-slate-900 text-white shadow-lg"
            aria-label={`Position du logement ${lodging.name}`}
          >
            <Home className="h-4 w-4" aria-hidden="true" />
          </span>
        </Marker>
        {visiblePois.map(poi => (
          <Marker
            key={poi.id}
            longitude={poi.longitude}
            latitude={poi.latitude}
            anchor="bottom"
            onClick={event => {
              event.originalEvent.stopPropagation()
              onSelectPoi(poi)
            }}
          >
            <button
              type="button"
              aria-label={`Sélectionner ${poi.name}`}
              onClick={() => onSelectPoi(poi)}
              className={`grid h-8 w-8 place-items-center rounded-full border-[3px] border-white text-white shadow-md transition ${
                markerClasses[poi.category.slug] ?? 'bg-pink-600'
              } ${
                selectedPoiId === poi.id
                  ? 'scale-125 ring-2 ring-slate-900/25'
                  : ''
              }`}
            >
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </Marker>
        ))}
      </Map>

      <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-white via-white/95 to-transparent px-3 pb-5 pt-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <MapFilter
            label="Tous"
            active={selectedCategorySlug === null}
            onClick={() => onFilter(null)}
          />
          {categories.map(category => (
            <MapFilter
              key={category.slug}
              label={category.name}
              active={selectedCategorySlug === category.slug}
              onClick={() => onFilter(category.slug)}
            />
          ))}
        </div>
      </div>

      {selectedPoi ? (
        <article className="absolute inset-x-3 bottom-3 z-10 overflow-hidden rounded-[22px] border border-white/80 bg-white/95 shadow-[0_16px_44px_rgba(15,23,42,0.24)] backdrop-blur-xl">
          <button
            type="button"
            onClick={() => onOpenPoi(selectedPoi)}
            className="grid w-full grid-cols-[78px_minmax(0,1fr)_28px] items-center gap-3 p-2.5 text-left"
            aria-label={`Ouvrir la fiche ${selectedPoi.name}`}
          >
            <span className="relative h-[68px] overflow-hidden rounded-[15px]">
              <Image
                src={selectedPoi.photos[0]}
                alt=""
                fill
                sizes="78px"
                className="object-cover"
              />
            </span>
            <span className="min-w-0">
              <span className="block text-[8px] font-extrabold uppercase tracking-[0.14em] text-pink-600">
                {selectedPoi.category.name}
              </span>
              <strong className="mt-1 block truncate text-xs text-slate-900">
                {selectedPoi.name}
              </strong>
              <span className="mt-1 flex items-center gap-1 text-[9px] text-slate-500">
                <Navigation className="h-3 w-3" aria-hidden="true" />
                {selectedPoi.distanceLabel ?? selectedPoi.address}
              </span>
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </button>
          <a
            href={selectedPoi.directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 border-t border-slate-100 py-2.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-700"
          >
            Itinéraire
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </article>
      ) : (
        <p className="absolute inset-x-3 bottom-3 z-10 rounded-full bg-white/95 px-4 py-3 text-center text-[10px] font-medium text-slate-600 shadow-lg backdrop-blur">
          Touchez un repère pour découvrir le lieu.
        </p>
      )}
    </div>
  )
}

function MapFilter({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-2 text-[8px] font-bold shadow-sm ${
        active
          ? 'bg-slate-900 text-white'
          : 'border border-slate-100 bg-white text-slate-600'
      }`}
    >
      {label}
    </button>
  )
}
