'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Home, Minus, Navigation, Plus } from 'lucide-react'
import Map, { Layer, Marker, Source, type MapRef } from 'react-map-gl/mapbox'
import { CategoryIcon } from '@/features/city-guide/lib/category-icon'
import type { DemoLodging, DemoPoi } from '@/features/guide-demo/types'
import { DemoPoiImage } from './DemoPoiImage'

const MARKER_PALETTE = [
  'bg-rose-600',
  'bg-orange-600',
  'bg-amber-600',
  'bg-lime-600',
  'bg-emerald-600',
  'bg-teal-600',
  'bg-cyan-600',
  'bg-sky-600',
  'bg-blue-600',
  'bg-indigo-600',
  'bg-violet-600',
  'bg-fuchsia-600',
  'bg-pink-600',
  'bg-red-700',
] as const

const overlayBottom = 'bottom-[calc(5.25rem+env(safe-area-inset-bottom))]'

type LngLat = [number, number]

type DemoMapViewProps = {
  lodging: DemoLodging
  pois: readonly DemoPoi[]
  selectedPoi: DemoPoi | null
  focusSelectedRoute: boolean
  selectedCategorySlug: string | null
  onFilter: (categorySlug: string | null) => void
  onSelectPoi: (poi: DemoPoi) => void
  onDeselectPoi: () => void
  onOpenPoi: (poi: DemoPoi) => void
}

export function DemoMapView({
  lodging,
  pois,
  selectedPoi,
  focusSelectedRoute,
  selectedCategorySlug,
  onFilter,
  onSelectPoi,
  onDeselectPoi,
  onOpenPoi,
}: DemoMapViewProps) {
  const mapRef = useRef<MapRef | null>(null)
  const previewRef = useRef<HTMLElement>(null)
  const markerRefs = useRef(new globalThis.Map<DemoPoi['id'], HTMLButtonElement>())
  const [peeked, setPeeked] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const hideTimer = useRef(0)

  const categories = useMemo(
    () =>
      Array.from(
        new globalThis.Map(
          pois.map(poi => [poi.category.slug, poi.category]),
        ).values(),
      ),
    [pois],
  )
  const visiblePois = selectedCategorySlug
    ? pois.filter(poi => poi.category.slug === selectedCategorySlug)
    : pois
  const routeCoords = useMemo<LngLat[] | null>(() => {
    const route =
      selectedPoi?.walkingRoute?.map<LngLat>(([longitude, latitude]) => [
        longitude,
        latitude,
      ]) ?? []
    return route.length >= 2 ? route : null
  }, [selectedPoi])
  const categoryColorBySlug = useMemo(() => {
    const colors = new globalThis.Map<string, string>()
    categories.forEach((category, index) => {
      colors.set(category.slug, MARKER_PALETTE[index % MARKER_PALETTE.length])
    })
    return colors
  }, [categories])

  function scheduleHide() {
    if (typeof window === 'undefined') return
    window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => setPeeked(true), 5000)
  }

  function restoreCard() {
    setPeeked(false)
    scheduleHide()
  }

  function handleMarkerSelect(poi: DemoPoi) {
    if (poi.id === selectedPoi?.id) {
      restoreCard()
      return
    }
    setPeeked(false)
    onSelectPoi(poi)
  }

  function closePreview() {
    const markerId = selectedPoi?.id
    onDeselectPoi()
    if (markerId) {
      queueMicrotask(() => markerRefs.current.get(markerId)?.focus())
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') window.clearTimeout(hideTimer.current)
    if (!selectedPoi) return

    if (!focusSelectedRoute) {
      previewRef.current?.focus()
      scheduleHide()
    }

    if (!mapReady || !routeCoords) return

    const framedPoints: LngLat[] = [
      ...routeCoords,
      [lodging.longitude, lodging.latitude],
      [selectedPoi.longitude, selectedPoi.latitude],
    ]
    let minLongitude = framedPoints[0][0]
    let minLatitude = framedPoints[0][1]
    let maxLongitude = framedPoints[0][0]
    let maxLatitude = framedPoints[0][1]
    for (const [longitude, latitude] of framedPoints) {
      minLongitude = Math.min(minLongitude, longitude)
      minLatitude = Math.min(minLatitude, latitude)
      maxLongitude = Math.max(maxLongitude, longitude)
      maxLatitude = Math.max(maxLatitude, latitude)
    }

    const map = mapRef.current?.getMap?.()
    map?.fitBounds(
      [
        [minLongitude, minLatitude],
        [maxLongitude, maxLatitude],
      ],
      {
        padding: focusSelectedRoute
          ? { top: 104, bottom: 104, left: 28, right: 28 }
          : { top: 140, bottom: 224, left: 44, right: 44 },
        duration: 0,
        maxZoom: focusSelectedRoute ? 17 : 16,
      },
    )

    return () => {
      if (typeof window !== 'undefined') window.clearTimeout(hideTimer.current)
    }
  }, [focusSelectedRoute, lodging.latitude, lodging.longitude, mapReady, routeCoords, selectedPoi])

  const categoryReady = useRef(false)
  useEffect(() => {
    if (!categoryReady.current) {
      categoryReady.current = true
      return
    }

    const map = mapRef.current?.getMap?.()
    if (!map?.fitBounds || focusSelectedRoute) return
    const list = selectedCategorySlug
      ? pois.filter(poi => poi.category.slug === selectedCategorySlug)
      : pois
    const points: LngLat[] = list.map(poi => [poi.longitude, poi.latitude])
    points.push([lodging.longitude, lodging.latitude])

    let minX = points[0][0]
    let minY = points[0][1]
    let maxX = points[0][0]
    let maxY = points[0][1]
    for (const [longitude, latitude] of points) {
      minX = Math.min(minX, longitude)
      minY = Math.min(minY, latitude)
      maxX = Math.max(maxX, longitude)
      maxY = Math.max(maxY, latitude)
    }
    map.easeTo({ pitch: 0, duration: 0 })
    map.fitBounds(
      [
        [minX, minY],
        [maxX, maxY],
      ],
      {
        padding: { top: 140, bottom: 120, left: 44, right: 44 },
        duration: 700,
        maxZoom: 15,
      },
    )
  }, [focusSelectedRoute, selectedCategorySlug, pois, lodging.latitude, lodging.longitude])

  const routeFeature =
    routeCoords
      ? {
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: routeCoords,
          },
          properties: {},
        }
      : null

  function zoomBy(delta: number) {
    const map = mapRef.current?.getMap?.()
    map?.easeTo({ zoom: (map.getZoom?.() ?? 13) + delta, duration: 300 })
  }

  function handleMapLoad() {
    const map = mapRef.current?.getMap?.()
    if (!map) return
    setMapReady(true)
    if (map.getLayer('3d-buildings')) return
    const labelLayerId = map
      .getStyle()
      ?.layers?.find(
        layer =>
          layer.type === 'symbol' &&
          (layer.layout as { 'text-field'?: unknown } | undefined)?.[
            'text-field'
          ],
      )?.id
    map.addLayer(
      {
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': '#d9d9de',
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14,
            0,
            15.5,
            ['get', 'height'],
          ],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.9,
        },
      } as Parameters<typeof map.addLayer>[0],
      labelLayerId,
    )
  }

  function handleZoomEnd() {
    const map = mapRef.current?.getMap?.()
    if (!map) return
    const targetPitch = (map.getZoom?.() ?? 0) >= 15 ? 55 : 0
    if (Math.abs((map.getPitch?.() ?? 0) - targetPitch) > 2) {
      map.easeTo({ pitch: targetPitch, duration: 450 })
    }
  }

  return (
    <div
      className="relative h-full min-h-[460px] w-full overflow-hidden bg-slate-100"
      data-testid="guide-map"
      data-selected-poi-id={selectedPoi?.id ?? ''}
      data-route-focused={focusSelectedRoute ? 'true' : 'false'}
    >
      <h1
        data-demo-view-heading="true"
        tabIndex={-1}
        className="sr-only"
      >
        Carte des coups de cœur
      </h1>
      <Map
        ref={mapRef}
        style={{ width: '100%', height: '100%' }}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          latitude: lodging.latitude,
          longitude: lodging.longitude,
          zoom: 12.2,
          pitch: 0,
        }}
        maxPitch={62}
        onClick={closePreview}
        onLoad={handleMapLoad}
        onZoomEnd={handleZoomEnd}
        mapStyle="mapbox://styles/mapbox/light-v11"
      >
        {routeFeature ? (
          <Source id="guide-route" type="geojson" data={routeFeature} lineMetrics>
            <Layer
              id="guide-route-halo"
              type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{
                'line-color': '#db2777',
                'line-width': 11,
                'line-opacity': 0.18,
                'line-blur': 4,
              }}
            />
            <Layer
              id="guide-route-line"
              type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{
                'line-color': '#db2777',
                'line-width': 4,
                'line-opacity': 0.95,
              }}
            />
          </Source>
        ) : null}

        <Marker longitude={lodging.longitude} latitude={lodging.latitude} anchor="bottom">
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
              handleMarkerSelect(poi)
            }}
          >
            <button
              ref={element => {
                if (element) markerRefs.current.set(poi.id, element)
                else markerRefs.current.delete(poi.id)
              }}
              type="button"
              aria-label={`Sélectionner ${poi.name}`}
              onClick={() => handleMarkerSelect(poi)}
              className={`grid h-8 w-8 place-items-center rounded-full border-[3px] border-white text-white shadow-md transition ${
                categoryColorBySlug.get(poi.category.slug) ?? 'bg-slate-600'
              } ${
                selectedPoi?.id === poi.id
                  ? 'scale-125 ring-2 ring-slate-900/25'
                  : ''
              }`}
            >
              <CategoryIcon
                iconSlug={poi.category.icon}
                categorySlug={poi.category.slug}
                className="h-3.5 w-3.5"
              />
            </button>
          </Marker>
        ))}
      </Map>

      <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-white via-white/95 to-transparent px-3 pb-5 pt-3">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
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

      <div className="absolute right-3 top-[68px] z-10 flex flex-col divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100 bg-white/95 shadow-md backdrop-blur">
        <button
          type="button"
          aria-label="Zoomer"
          onClick={() => zoomBy(1)}
          className="grid h-8 w-8 place-items-center text-slate-700 active:bg-slate-50"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Dézoomer"
          onClick={() => zoomBy(-1)}
          className="grid h-8 w-8 place-items-center text-slate-700 active:bg-slate-50"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <AnimatePresence>
        {selectedPoi && !focusSelectedRoute ? (
          <motion.article
            ref={previewRef}
            data-testid="demo-map-preview"
            role="region"
            aria-label={`Aperçu de ${selectedPoi.name}`}
            aria-live="polite"
            tabIndex={-1}
            key={selectedPoi.id}
            initial={{ y: 28, opacity: 0, x: 0 }}
            animate={{ y: 0, opacity: 1, x: peeked ? 'calc(-100% + 20px)' : 0 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className={`absolute inset-x-3 ${overlayBottom} z-10 overflow-hidden rounded-[22px] border border-white/80 bg-white/95 shadow-[0_16px_44px_rgba(15,23,42,0.24)] backdrop-blur-xl`}
          >
            {peeked ? (
              <button
                type="button"
                onClick={restoreCard}
                aria-label="Afficher la fiche"
                className="absolute inset-y-0 right-0 z-20 flex w-5 items-center justify-center"
              >
                <span className="h-6 w-1 rounded-full bg-slate-300" />
              </button>
            ) : null}

            {!peeked ? (
              <button
                type="button"
                onClick={() => onOpenPoi(selectedPoi)}
                aria-label={`Ouvrir la fiche ${selectedPoi.name}`}
                className="absolute inset-0 z-[5]"
              />
            ) : null}

            <div
              className={`flex items-stretch gap-3 p-3 ${
                peeked ? 'pointer-events-none select-none' : ''
              }`}
            >
              <span className="relative w-[78px] shrink-0 self-stretch overflow-hidden rounded-[15px] bg-slate-100">
                <DemoPoiImage
                  primarySrc={selectedPoi.photos[0]}
                  category={selectedPoi.category}
                  name={selectedPoi.name}
                  decorative
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </span>

              <div className="min-w-0 flex-1">
                <span className="block text-[8px] font-extrabold uppercase tracking-[0.14em] text-pink-600">
                  {selectedPoi.category.name}
                </span>
                <strong className="mt-1 block truncate text-sm text-slate-900">
                  {selectedPoi.name}
                </strong>
                <span className="mt-1.5 block text-[10px] leading-4 text-slate-500">
                  {selectedPoi.distanceLabel ??
                    selectedPoi.address.split(',').map((part, index) => (
                      <span key={index} className="block">
                        {part.trim()}
                      </span>
                    ))}
                </span>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    aria-label="Itinéraire indisponible dans la démonstration"
                    className="relative z-10 inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-white py-1 pl-1 pr-3 text-[9px] font-bold uppercase tracking-[0.12em] shadow-[0_7px_16px_rgba(17,24,39,0.1)]"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EF5148] text-white">
                      <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span className="text-[#EF5148]">Itinéraire</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.article>
        ) : null}
      </AnimatePresence>

      {pois.length === 0 ? (
        <div className="absolute inset-0 z-20 grid place-items-center p-8 text-center">
          <p className="rounded-2xl bg-white/90 px-5 py-4 text-sm font-medium text-slate-700 shadow-sm">
            Aucun coup de cœur à afficher sur cette carte.
          </p>
        </div>
      ) : null}
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
      className={`shrink-0 rounded-full px-3 py-2 text-[8px] font-bold uppercase tracking-wide shadow-sm ${
        active
          ? 'bg-slate-900 text-white'
          : 'border border-slate-100 bg-white text-slate-600'
      }`}
    >
      {label}
    </button>
  )
}
