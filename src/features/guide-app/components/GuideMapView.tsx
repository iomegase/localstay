'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, Home, MapPin, Minus, Navigation, Plus } from 'lucide-react'
import Map, { Layer, Marker, Source, type MapRef } from 'react-map-gl/mapbox'
import { getGuidePoiHeroImage } from '@/features/guide-app/lib/poi-image'
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

/** Position basse de la POI card / du hint : au-dessus de la barre de nav. */
const overlayBottom = 'bottom-[calc(5.25rem+env(safe-area-inset-bottom))]'

type LngLat = [number, number]

type RouteResult = {
  coords: LngLat[]
  meta: { distance: number; duration: number } | null
}

function segmentDistance(a: LngLat, b: LngLat) {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

/** Renvoie le début du tracé jusqu'à `fraction` (0→1) de sa longueur totale. */
function sliceLine(coords: LngLat[], fraction: number): LngLat[] {
  if (coords.length < 2 || fraction >= 1) return coords
  const lengths: number[] = []
  let total = 0
  for (let i = 1; i < coords.length; i++) {
    const d = segmentDistance(coords[i - 1], coords[i])
    lengths.push(d)
    total += d
  }
  const target = total * Math.max(0, fraction)
  const out: LngLat[] = [coords[0]]
  let acc = 0
  for (let i = 1; i < coords.length; i++) {
    const d = lengths[i - 1]
    if (acc + d >= target) {
      const r = d === 0 ? 0 : (target - acc) / d
      const a = coords[i - 1]
      const b = coords[i]
      out.push([a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r])
      break
    }
    acc += d
    out.push(coords[i])
  }
  return out
}

/** Itinéraire piéton Mapbox ; repli sur une ligne directe si indisponible. */
async function fetchRoute(from: LngLat, to: LngLat): Promise<RouteResult> {
  const straight: RouteResult = { coords: [from, to], meta: null }
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token || typeof fetch !== 'function') return straight
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&overview=full&access_token=${token}`
    const res = await fetch(url)
    if (!res.ok) throw new Error('directions')
    const data = await res.json()
    const route = data?.routes?.[0]
    const coords = route?.geometry?.coordinates as LngLat[] | undefined
    if (!Array.isArray(coords) || coords.length < 2) throw new Error('empty')
    return {
      coords,
      meta: { distance: route.distance, duration: route.duration },
    }
  } catch {
    return straight
  }
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
  const [drawnCoords, setDrawnCoords] = useState<LngLat[] | null>(null)
  const [peeked, setPeeked] = useState(false)
  const hideTimer = useRef(0)
  const selectedPoi =
    pois.find(poi => poi.id === selectedPoiId) ?? null
  const heroImage = selectedPoi
    ? getGuidePoiHeroImage({
        categorySlug: selectedPoi.category.slug,
        photos: selectedPoi.photos,
      })
    : ''

  function scheduleHide() {
    if (typeof window === 'undefined') return
    window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => setPeeked(true), 5000)
  }

  function restoreCard() {
    setPeeked(false)
    scheduleHide()
  }

  // Recadre la carte sur les POIs de la catégorie (les contenir tous à l'écran).
  const categoryReady = useRef(false)
  useEffect(() => {
    if (!categoryReady.current) {
      categoryReady.current = true
      return
    }
    const map = mapRef.current?.getMap?.()
    if (!map?.fitBounds) return
    const list = selectedCategorySlug
      ? pois.filter(poi => poi.category.slug === selectedCategorySlug)
      : pois
    const points: LngLat[] = list.map(poi => [poi.longitude, poi.latitude])
    points.push([lodging.longitude, lodging.latitude])
    if (points.length === 0) return
    let minX = points[0][0]
    let minY = points[0][1]
    let maxX = points[0][0]
    let maxY = points[0][1]
    for (const [x, y] of points) {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
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
  }, [selectedCategorySlug, pois, lodging.longitude, lodging.latitude])

  // La card s'escamote sur la droite 5 s après l'ouverture ; reset à chaque POI.
  useEffect(() => {
    setPeeked(false)
    if (typeof window !== 'undefined') window.clearTimeout(hideTimer.current)
    if (!selectedPoiId) return
    scheduleHide()
    return () => {
      if (typeof window !== 'undefined') window.clearTimeout(hideTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPoiId])
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
    if (!selectedPoi) {
      setDrawnCoords(null)
      return
    }

    let cancelled = false
    let raf = 0
    const from: LngLat = [lodging.longitude, lodging.latitude]
    const to: LngLat = [selectedPoi.longitude, selectedPoi.latitude]

    fetchRoute(from, to).then(({ coords }) => {
      if (cancelled) return

      // Cadre la carte sur l'ensemble du trajet (logement + POI + tracé).
      const map = mapRef.current?.getMap?.()
      if (map?.fitBounds) {
        let minX = coords[0][0]
        let minY = coords[0][1]
        let maxX = coords[0][0]
        let maxY = coords[0][1]
        for (const [x, y] of coords) {
          minX = Math.min(minX, x)
          minY = Math.min(minY, y)
          maxX = Math.max(maxX, x)
          maxY = Math.max(maxY, y)
        }
        map.fitBounds(
          [
            [minX, minY],
            [maxX, maxY],
          ],
          {
            // bottom élevé : garde le tracé ET le repère logement au-dessus de
            // la POI card ; le reste garde le parcours entier dans le cadre.
            padding: { top: 140, bottom: 224, left: 44, right: 44 },
            duration: 700,
            maxZoom: 16,
          },
        )
      }

      const reduce =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce || typeof requestAnimationFrame !== 'function') {
        setDrawnCoords(coords)
        return
      }

      const start = performance.now()
      const duration = 1000
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - t, 3)
        setDrawnCoords(sliceLine(coords, eased))
        if (t < 1 && !cancelled) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    })

    return () => {
      cancelled = true
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf)
    }
  }, [selectedPoi, lodging.longitude, lodging.latitude])

  const routeFeature =
    drawnCoords && drawnCoords.length >= 2
      ? {
          type: 'Feature' as const,
          geometry: { type: 'LineString' as const, coordinates: drawnCoords },
          properties: {},
        }
      : null

  function zoomBy(delta: number) {
    const map = mapRef.current?.getMap?.()
    map?.easeTo({ zoom: (map.getZoom?.() ?? 13) + delta, duration: 300 })
  }

  /** Ajoute les bâtiments 3D une fois le style chargé. */
  function handleMapLoad() {
    const map = mapRef.current?.getMap?.()
    if (!map || map.getLayer('3d-buildings')) return
    const labelLayerId = map
      .getStyle()
      ?.layers?.find(
        layer =>
          layer.type === 'symbol' &&
          (layer.layout as { 'text-field'?: unknown } | undefined)?.['text-field'],
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

  /** Incline la caméra (tilt 3D) quand l'utilisateur zoome. */
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
          pitch: 0,
        }}
        maxPitch={62}
        onLoad={handleMapLoad}
        onZoomEnd={handleZoomEnd}
        mapStyle="mapbox://styles/mapbox/light-v11"
      >
        {routeFeature && (
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
        )}
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
        {selectedPoi && (
          <motion.article
            key={selectedPoi.id}
            initial={{ y: 28, opacity: 0, x: 0 }}
            animate={{ y: 0, opacity: 1, x: peeked ? 'calc(-100% + 20px)' : 0 }}
            exit={{ y: 28, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className={`absolute inset-x-3 ${overlayBottom} z-10 overflow-hidden rounded-[22px] border border-white/80 bg-white/95 shadow-[0_16px_44px_rgba(15,23,42,0.24)] backdrop-blur-xl`}
          >
            {peeked && (
              <button
                type="button"
                onClick={restoreCard}
                aria-label="Afficher la fiche"
                className="absolute inset-y-0 right-0 z-20 flex w-5 items-center justify-center"
              >
                <span className="h-6 w-1 rounded-full bg-slate-300" />
              </button>
            )}

            <div
              className={`flex items-stretch gap-3 p-3 ${
                peeked ? 'pointer-events-none select-none' : ''
              }`}
            >
              <span className="relative w-[78px] shrink-0 self-stretch overflow-hidden rounded-[15px] bg-slate-100">
                <Image
                  src={heroImage}
                  alt=""
                  fill
                  sizes="78px"
                  unoptimized={heroImage.startsWith('https://')}
                  className="object-cover"
                />
              </span>

              <div className="min-w-0 flex-1">
                <span className="block text-[8px] font-extrabold uppercase tracking-[0.14em] text-pink-600">
                  {selectedPoi.category.name}
                </span>
                <strong className="mt-1 block truncate text-sm text-slate-900">
                  {selectedPoi.name}
                </strong>

                <span className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500">
                  <Navigation className="h-3 w-3" aria-hidden="true" />
                  {selectedPoi.distanceLabel ?? selectedPoi.address}
                </span>

                <div className="mt-2.5 flex items-center gap-2">
                  <a
                    href={selectedPoi.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-white py-1 pl-1 pr-3 text-[9px] font-bold uppercase tracking-[0.12em] shadow-[0_7px_16px_rgba(17,24,39,0.1)]"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EF5148] text-white">
                      <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span className="text-[#EF5148]">Itinéraire</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => onOpenPoi(selectedPoi)}
                    aria-label={`Ouvrir la fiche ${selectedPoi.name}`}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </motion.article>
        )}
      </AnimatePresence>
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
