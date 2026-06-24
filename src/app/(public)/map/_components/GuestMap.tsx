'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Map, { Marker, NavigationControl, Layer, type MapRef } from 'react-map-gl/mapbox'
import type { FillExtrusionLayerSpecification } from 'mapbox-gl'
import * as LucideIcons from 'lucide-react'

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

function resolveLucideIcon(iconSlug?: string): LucideIcons.LucideIcon {
  if (!iconSlug) return LucideIcons.MapPin
  const componentName = iconSlug
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('') as keyof typeof LucideIcons
  const candidate = LucideIcons[componentName] as LucideIcons.LucideIcon | undefined
  return candidate ?? LucideIcons.MapPin
}

export function GuestMap({ pois }: { pois: GuestMapPoi[] }) {
  const mapRef = useRef<MapRef | null>(null)
  const [active, setActive] = useState<GuestMapPoi | null>(null)

  // Plein écran immersif : masque header + bottom-nav du layout public.
  useEffect(() => {
    document.body.classList.add('immersive-map')
    return () => document.body.classList.remove('immersive-map')
  }, [])

  const center = useMemo(() => {
    if (pois.length === 0) return { latitude: 45.9237, longitude: 6.8694 } // Chamonix fallback
    const lat = pois.reduce((s, p) => s + p.latitude, 0) / pois.length
    const lng = pois.reduce((s, p) => s + p.longitude, 0) / pois.length
    return { latitude: lat, longitude: lng }
  }, [pois])

  const fitToPois = () => {
    const map = mapRef.current
    if (!map || pois.length === 0) return
    if (pois.length === 1) {
      map.flyTo({ center: [pois[0].longitude, pois[0].latitude], zoom: 14, duration: 0 })
      return
    }
    let minLng = Infinity
    let minLat = Infinity
    let maxLng = -Infinity
    let maxLat = -Infinity
    for (const p of pois) {
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
      { padding: { top: 90, bottom: 120, left: 60, right: 60 }, maxZoom: 15, duration: 0 },
    )
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-cream" data-testid="guest-map">
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{ ...center, zoom: 12, pitch: 0 }}
        maxPitch={75}
        onLoad={fitToPois}
        onZoomEnd={event => {
          // Bascule en vue 3D inclinée dès qu'on s'approche des bâtiments.
          const map = event.target
          const zoom = map.getZoom()
          const pitch = map.getPitch()
          if (zoom >= 15 && pitch < 10) {
            map.easeTo({ pitch: 55, duration: 600 })
          } else if (zoom < 14 && pitch > 10) {
            map.easeTo({ pitch: 0, duration: 600 })
          }
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
      >
        <NavigationControl position="top-right" visualizePitch />
        <Layer {...buildings3DLayer} />

        {pois.map(poi => {
          const Icon = resolveLucideIcon(poi.categoryIcon)
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

      {/* Compteur flottant */}
      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-charcoal shadow-lg backdrop-blur">
        {pois.length} {pois.length > 1 ? 'lieux recommandés' : 'lieu recommandé'}
      </div>

      {/* Retour */}
      <Link
        href="/nos-recommandations"
        aria-label="Retour"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-lg backdrop-blur"
      >
        <LucideIcons.X className="h-5 w-5" />
      </Link>

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
