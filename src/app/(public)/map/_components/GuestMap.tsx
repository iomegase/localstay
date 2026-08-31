'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Map, { Marker, NavigationControl, Layer, Source, type MapRef } from 'react-map-gl/mapbox'
import type { FillExtrusionLayerSpecification } from 'mapbox-gl'
import * as LucideIcons from 'lucide-react'
import { getPublicCategoryIconSlug } from '@/features/city-guide/lib/public-category-icon'

// Tuiles IGN libres (Géoplateforme, WMTS PseudoMercator, sans clé).
const IGN_WMTS = 'https://data.geopf.fr/wmts'
function ignTileUrl(layer: string, format: string): string {
  const params = new URLSearchParams({
    SERVICE: 'WMTS',
    REQUEST: 'GetTile',
    VERSION: '1.0.0',
    LAYER: layer,
    STYLE: 'normal',
    TILEMATRIXSET: 'PM',
    FORMAT: format,
    TILEMATRIX: '{z}',
    TILEROW: '{y}',
    TILECOL: '{x}',
  })
  // Les accolades de gabarit ne doivent pas être encodées pour Mapbox.
  return `${IGN_WMTS}?${params.toString()}`.replace(/%7B/g, '{').replace(/%7D/g, '}')
}

type BaseLayer = 'plan' | 'ign' | 'satellite'

const IGN_SOURCES: Record<Exclude<BaseLayer, 'plan'>, { tiles: string; attribution: string }> = {
  ign: {
    tiles: ignTileUrl('GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2', 'image/png'),
    attribution: '© IGN — Géoplateforme',
  },
  satellite: {
    tiles: ignTileUrl('ORTHOIMAGERY.ORTHOPHOTOS', 'image/jpeg'),
    attribution: '© IGN — Géoplateforme',
  },
}

const LAYER_LABELS: Record<BaseLayer, string> = {
  plan: 'Plan',
  ign: 'IGN',
  satellite: 'Satellite',
}

// Extrusion 3D des bâtiments (source `composite` incluse dans light-v11).
// Apparaît à partir du zoom 14, monte progressivement jusqu'au zoom 15.
const buildings3DLayer: FillExtrusionLayerSpecification = {
  id: '3d-buildings',
  source: 'composite',
  'source-layer': 'building',
  filter: ['==', 'extrude', 'true'],
  type: 'fill-extrusion',
  minzoom: 14,
  paint: {
    'fill-extrusion-color': '#d9d6cd',
    'fill-extrusion-height': [
      'interpolate',
      ['linear'],
      ['zoom'],
      14,
      0,
      15.05,
      ['get', 'height'],
    ],
    'fill-extrusion-base': [
      'interpolate',
      ['linear'],
      ['zoom'],
      14,
      0,
      15.05,
      ['get', 'min_height'],
    ],
    'fill-extrusion-opacity': 0.65,
  },
}

export type GuestMapPoi = {
  id: string
  name: string
  slug: string
  latitude: number
  longitude: number
  photo_url: string | null
  rating: number | null
  owner_note: string | null
  categoryName: string
  categorySlug: string
  categoryIcon: string
  categoryColor: string
  citySlug: string
}

export type GuestMapLodgingLocation = {
  latitude: number
  longitude: number
  name: string
  photoUrl: string | null
}

type CategoryFilter = {
  slug: string
  name: string
  icon: string
  color: string
  count: number
}

function resolveLucideIcon(iconSlug?: string): LucideIcons.LucideIcon {
  if (!iconSlug) return LucideIcons.MapPin
  const componentName = iconSlug
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('') as keyof typeof LucideIcons
  const candidate = LucideIcons[componentName] as LucideIcons.LucideIcon | undefined
  return candidate ?? LucideIcons.MapPin
}

export function GuestMap({
  pois,
  lodgingLocation = null,
}: {
  pois: GuestMapPoi[]
  lodgingLocation?: GuestMapLodgingLocation | null
}) {
  const mapRef = useRef<MapRef | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInitializationPhaseRef = useRef<'waiting-for-load' | 'waiting-for-fit' | 'ready'>(
    'waiting-for-load',
  )
  const [active, setActive] = useState<GuestMapPoi | null>(null)
  const [baseLayer, setBaseLayer] = useState<BaseLayer>('plan')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null)
  const [hasLoadedMap, setHasLoadedMap] = useState(false)

  function observeMapZoom(zoom: number): void {
    if (mapContainerRef.current) {
      mapContainerRef.current.dataset.mapZoom = String(zoom)
    }
  }

  function markMapReady(ready: boolean): void {
    if (mapContainerRef.current) {
      mapContainerRef.current.dataset.mapReady = String(ready)
    }
  }

  // Plein écran immersif : masque header + bottom-nav du layout public.
  useEffect(() => {
    document.body.classList.add('immersive-map')
    return () => document.body.classList.remove('immersive-map')
  }, [])

  const center = useMemo(() => {
    if (pois.length === 0) {
      return lodgingLocation
        ? { latitude: lodgingLocation.latitude, longitude: lodgingLocation.longitude }
        : { latitude: 45.9237, longitude: 6.8694 } // Chamonix fallback
    }
    const lat = pois.reduce((s, p) => s + p.latitude, 0) / pois.length
    const lng = pois.reduce((s, p) => s + p.longitude, 0) / pois.length
    return { latitude: lat, longitude: lng }
  }, [lodgingLocation, pois])

  const categoryFilters = useMemo(() => {
    const map = new globalThis.Map<string, CategoryFilter>()
    for (const poi of pois) {
      const existing = map.get(poi.categorySlug)
      if (existing) {
        existing.count += 1
      } else {
        map.set(poi.categorySlug, {
          slug: poi.categorySlug,
          name: poi.categoryName,
          icon: getPublicCategoryIconSlug(poi.categorySlug, poi.categoryIcon),
          color: poi.categoryColor,
          count: 1,
        })
      }
    }
    return [...map.values()]
  }, [pois])

  const visiblePois = useMemo(() => {
    if (!selectedCategorySlug) return pois
    return pois.filter(poi => poi.categorySlug === selectedCategorySlug)
  }, [pois, selectedCategorySlug])

  const fitToPois = useCallback((targetPois: GuestMapPoi[], duration = 0) => {
    const map = mapRef.current
    if (!map || targetPois.length === 0) return
    if (targetPois.length === 1) {
      map.flyTo({
        center: [targetPois[0].longitude, targetPois[0].latitude],
        zoom: 14,
        duration,
      })
      return
    }
    let minLng = Infinity
    let minLat = Infinity
    let maxLng = -Infinity
    let maxLat = -Infinity
    for (const p of targetPois) {
      minLng = Math.min(minLng, p.longitude)
      maxLng = Math.max(maxLng, p.longitude)
      minLat = Math.min(minLat, p.latitude)
      maxLat = Math.max(maxLat, p.latitude)
    }
    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: { top: 90, bottom: 120, left: 60, right: 60 }, maxZoom: 15, duration },
    )
  }, [])

  useEffect(() => {
    if (!hasLoadedMap) return

    const map = mapRef.current
    if (!map) return

    if (visiblePois.length === 0) {
      mapInitializationPhaseRef.current = 'ready'
      observeMapZoom(map.getZoom())
      markMapReady(true)
      return
    }

    mapInitializationPhaseRef.current = 'waiting-for-fit'
    markMapReady(false)
    fitToPois(visiblePois, 300)
  }, [fitToPois, hasLoadedMap, visiblePois])

  useEffect(() => {
    if (active && !visiblePois.some(poi => poi.id === active.id)) {
      setActive(null)
    }
  }, [active, visiblePois])

  return (
    <div
      ref={mapContainerRef}
      className="relative h-[100dvh] w-full overflow-hidden bg-white"
      data-testid="guest-map"
    >
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{ ...center, zoom: 12, pitch: 0 }}
        maxPitch={75}
        terrain={{ source: 'mapbox-dem', exaggeration: 1.4 }}
        onLoad={event => {
          observeMapZoom(event.target.getZoom())
          markMapReady(false)
          setHasLoadedMap(true)
          fitToPois(visiblePois)
        }}
        onIdle={event => {
          observeMapZoom(event.target.getZoom())
          if (mapInitializationPhaseRef.current === 'waiting-for-fit') {
            mapInitializationPhaseRef.current = 'ready'
            markMapReady(true)
          }
        }}
        onZoomEnd={event => {
          // Bascule en vue 3D inclinée dès qu'on s'approche (relief + bâtiments).
          const map = event.target
          const zoom = map.getZoom()
          const pitch = map.getPitch()
          observeMapZoom(zoom)
          if (zoom >= 14 && pitch < 10) {
            map.easeTo({ pitch: 60, duration: 600 })
          } else if (zoom < 13 && pitch > 10) {
            map.easeTo({ pitch: 0, duration: 600 })
          }
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
      >
        <NavigationControl position="top-right" visualizePitch />

        {/* Relief : draine les fonds (IGN/satellite inclus) sur l'élévation réelle */}
        <Source
          id="mapbox-dem"
          type="raster-dem"
          url="mapbox://mapbox.mapbox-terrain-dem-v1"
          tileSize={512}
          maxzoom={14}
        />

        {baseLayer !== 'plan' && (
          <Source
            key={baseLayer}
            id="ign-base"
            type="raster"
            tiles={[IGN_SOURCES[baseLayer].tiles]}
            tileSize={256}
            attribution={IGN_SOURCES[baseLayer].attribution}
          >
            <Layer id="ign-base-layer" type="raster" beforeId="3d-buildings" />
          </Source>
        )}

        <Layer {...buildings3DLayer} />

        {visiblePois.map(poi => {
          const Icon = resolveLucideIcon(getPublicCategoryIconSlug(poi.categorySlug, poi.categoryIcon))
          return (
            <Marker
              key={poi.id}
              longitude={poi.longitude}
              latitude={poi.latitude}
              anchor="center"
              onClick={event => {
                event.originalEvent.stopPropagation()
                setActive(poi)
              }}
            >
              <div
                role="button"
                aria-label={poi.name}
                title={poi.name}
                className="poi-teardrop"
                style={{ background: poi.categoryColor }}
              >
                <Icon className="poi-teardrop-icon" />
              </div>
            </Marker>
          )
        })}

        {lodgingLocation && (
          <Marker
            longitude={lodgingLocation.longitude}
            latitude={lodgingLocation.latitude}
            anchor="bottom"
          >
            <div
              data-testid="lodging-map-pin"
              aria-label={`Position du logement ${lodgingLocation.name}`}
              title={`Position du logement ${lodgingLocation.name}`}
              tabIndex={0}
              className="group relative flex h-12 w-12 items-center justify-center pb-2 outline-none"
            >
              <div
                data-testid="lodging-map-card"
                className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 flex w-44 -translate-x-1/2 items-center gap-2 rounded-2xl bg-white/95 p-2 text-left opacity-0 shadow-[0_14px_34px_rgba(18,18,18,0.2)] ring-1 ring-black/5 backdrop-blur transition duration-150 group-hover:opacity-100 group-focus:opacity-100"
              >
                {lodgingLocation.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={lodgingLocation.photoUrl}
                    alt={lodgingLocation.name}
                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                    <LucideIcons.Home className="h-5 w-5" />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-pink-600">
                    Logement
                  </span>
                  <span className="mt-0.5 block truncate text-sm font-semibold leading-tight text-charcoal">
                    {lodgingLocation.name}
                  </span>
                </span>
              </div>
              <span
                data-testid="lodging-map-pin-pulse"
                className="absolute bottom-2 h-10 w-10 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full bg-pink-500/15"
              />
              <span className="absolute bottom-1.5 h-3.5 w-3.5 rotate-45 rounded-[4px] bg-white shadow-[0_8px_16px_rgba(18,18,18,0.16)] ring-1 ring-pink-500/25" />
              <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-pink-600 shadow-[0_10px_22px_rgba(18,18,18,0.18)] ring-[3px] ring-white">
                <span className="absolute inset-1 rounded-full border border-pink-500/25" />
                <LucideIcons.Home className="relative h-4 w-4" />
              </span>
            </div>
          </Marker>
        )}

      </Map>

      {/* Modal fiche POI — apparaît au clic sur un marqueur */}
      {active && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center"
          data-testid="poi-modal"
          role="dialog"
          aria-modal="true"
          aria-label={active.name}
        >
          {/* Fond cliquable pour fermer */}
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setActive(null)}
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-[2px]"
          />

          <div className="relative z-10 mx-3 w-full max-w-[364px]">
            {/* Toute la carte est un lien vers la fiche POI */}
            <Link
              href={`/guide/${active.citySlug}/${active.categorySlug}/${active.slug}`}
              className="block overflow-hidden rounded-3xl bg-white shadow-2xl transition-transform hover:scale-[1.01]"
              data-testid="poi-modal-link"
            >
              {active.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={active.photo_url}
                  alt={active.name}
                  className="h-40 w-full object-cover"
                />
              )}

              <div className="space-y-2 p-4">
                <p
                  className="text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: active.categoryColor }}
                >
                  {active.categoryName}
                </p>
                <h2 className="text-base font-semibold leading-tight text-charcoal">
                  {active.name}
                </h2>
                {typeof active.rating === 'number' && (
                  <p className="text-xs text-charcoal/60">★ {active.rating.toFixed(1)}</p>
                )}
                {active.owner_note && active.owner_note.trim().length > 0 && (
                  <p className="line-clamp-4 text-xs italic text-charcoal/70">
                    “{active.owner_note.trim()}”
                  </p>
                )}

                <span className="mt-1 flex items-center justify-center gap-2 rounded-2xl bg-pine py-2.5 text-sm font-bold text-white">
                  Voir la fiche
                  <LucideIcons.ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>

            {/* Fermeture — hors du lien (un <button> ne peut être imbriqué dans un <a>) */}
            <button
              type="button"
              aria-label="Fermer"
              onClick={() => setActive(null)}
              className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-md backdrop-blur"
            >
              <LucideIcons.X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filtre catégories */}
      <button
        type="button"
        aria-label="Filtrer les catégories"
        onClick={() => setIsFilterOpen(true)}
        className="absolute left-0 top-36 z-10 flex h-20 w-16 items-center justify-center rounded-r-2xl bg-white text-charcoal shadow-[0_10px_24px_rgba(18,18,18,0.16)]"
      >
        <LucideIcons.SlidersHorizontal className="h-5 w-5" />
      </button>

      {isFilterOpen && (
        <div className="absolute inset-0 z-[60]">
          <button
            type="button"
            aria-label="Fermer les filtres"
            onClick={() => setIsFilterOpen(false)}
            className="absolute inset-0 bg-charcoal/30 backdrop-blur-[1px]"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Filtrer les catégories"
            className="absolute inset-y-0 left-0 w-[82%] max-w-[320px] rounded-r-[2rem] bg-white p-5 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-pink-600">
                  Catégories
                </p>
                <h2 className="mt-1 text-xl font-semibold text-charcoal">Filtrer</h2>
              </div>
              <button
                type="button"
                aria-label="Fermer les filtres"
                onClick={() => setIsFilterOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-charcoal"
              >
                <LucideIcons.X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <CategoryFilterButton
                label="Tous les lieux"
                count={pois.length}
                color="#121212"
                Icon={LucideIcons.Map}
                isActive={selectedCategorySlug === null}
                onClick={() => {
                  setSelectedCategorySlug(null)
                  setIsFilterOpen(false)
                }}
              />

              {categoryFilters.map(filter => (
                <CategoryFilterButton
                  key={filter.slug}
                  label={filter.name}
                  count={filter.count}
                  color={filter.color}
                  Icon={resolveLucideIcon(filter.icon)}
                  isActive={selectedCategorySlug === filter.slug}
                  onClick={() => {
                    setSelectedCategorySlug(filter.slug)
                    setIsFilterOpen(false)
                  }}
                />
              ))}
            </div>
          </aside>
        </div>
      )}

      {/* Bouton fermer + sélecteur de fond de carte (haut de page) */}
      <div className="absolute left-4 top-4 z-10">
        <Link
          href="/nos-recommandations"
          aria-label="Fermer la carte"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-lg backdrop-blur"
        >
          <LucideIcons.X className="h-5 w-5" />
        </Link>
      </div>

      <div
        role="group"
        aria-label="Fond de carte"
        className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 gap-0.5 rounded-full bg-white/95 p-0.5 shadow-[0_8px_20px_rgba(18,18,18,0.12)] ring-1 ring-black/5 backdrop-blur"
      >
        {(Object.keys(LAYER_LABELS) as BaseLayer[]).map(layer => (
          <button
            key={layer}
            type="button"
            onClick={() => setBaseLayer(layer)}
            aria-pressed={baseLayer === layer}
            className={`h-7 min-w-[3.75rem] rounded-full px-2.5 text-[10px] font-semibold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal/25 ${
              baseLayer === layer
                ? 'bg-[#111111] text-white shadow-sm hover:bg-[#111111]'
                : 'text-charcoal/70 hover:bg-black/[0.04] hover:text-charcoal'
            }`}
          >
            {LAYER_LABELS[layer]}
          </button>
        ))}
      </div>

      {pois.length === 0 && (
        <div className="absolute inset-x-0 bottom-24 z-10 mx-auto w-[88%] rounded-2xl bg-white/95 p-5 text-center shadow-xl backdrop-blur">
          <p className="text-sm text-charcoal/70">
            Votre hôte n&apos;a pas encore sélectionné de lieux à vous recommander.
          </p>
        </div>
      )}

      <style jsx>{`
        .poi-teardrop {
          width: 42px;
          height: 42px;
          border-radius: 9999px 9999px 9999px 12px;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 14px 28px rgba(18, 18, 18, 0.22);
          border: 3px solid rgba(255, 255, 255, 0.9);
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .poi-teardrop:hover {
          transform: rotate(-45deg) scale(1.08);
        }
        .poi-teardrop :global(.poi-teardrop-icon) {
          width: 20px;
          height: 20px;
          transform: rotate(45deg);
        }
      `}</style>
    </div>
  )
}

function CategoryFilterButton({
  label,
  count,
  color,
  Icon,
  isActive,
  onClick,
}: {
  label: string
  count: number
  color: string
  Icon: LucideIcons.LucideIcon
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
        isActive ? 'border-charcoal bg-charcoal text-white' : 'border-black/5 bg-black/[0.03] text-charcoal'
      }`}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: color }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{label}</span>
      </span>
      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${isActive ? 'bg-white/15' : 'bg-white'}`}>
        {count}
      </span>
    </button>
  )
}
