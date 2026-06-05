'use client'
import { useState } from 'react'
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox'
import * as LucideIcons from 'lucide-react'
import { getInitialViewState } from '../lib/map-utils'
import type { PoiCard } from '../types'

interface PopupInfo {
  longitude: number
  latitude: number
  name: string
  slug: string
  rating: number | null
  photo_url: string | null
}

interface Props {
  pois: PoiCard[]
  cityCenter: { latitude: number; longitude: number }
  citySlug: string
  categorySlug: string
  categoryIcon?: string
  categoryColor?: string
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

export function FullMap({
  pois,
  cityCenter,
  citySlug,
  categorySlug,
  categoryIcon,
  categoryColor = '#455E4C',
}: Props) {
  const [popup, setPopup] = useState<PopupInfo | null>(null)
  const Icon = resolveLucideIcon(categoryIcon)

  return (
    <div
      className="relative h-[520px] w-full overflow-hidden rounded-[2.4rem] border border-gray-100 shadow-sm"
      data-testid="full-map"
    >
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={getInitialViewState(cityCenter.latitude, cityCenter.longitude)}
        dragRotate={false}
        onLoad={event => event.target.touchZoomRotate.disableRotation()}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
      >
        <NavigationControl position="top-right" />

        {pois.map(poi => (
          <Marker
            key={poi.id}
            longitude={poi.longitude}
            latitude={poi.latitude}
            anchor="center"
            onClick={event => {
              event.originalEvent.stopPropagation()
              setPopup({
                longitude: poi.longitude,
                latitude: poi.latitude,
                name: poi.name,
                slug: poi.slug,
                rating: poi.rating,
                photo_url: poi.photo_url,
              })
            }}
          >
            <div
              role="button"
              aria-label={poi.name}
              title={poi.name}
              className="poi-teardrop"
              style={{ background: categoryColor }}
            >
              <Icon className="poi-teardrop-icon" />
            </div>
          </Marker>
        ))}

        {popup && (
          <Popup
            longitude={popup.longitude}
            latitude={popup.latitude}
            anchor="bottom"
            offset={28}
            onClose={() => setPopup(null)}
            closeOnClick
          >
            <div className="w-48 space-y-1" data-testid="popup-content">
              {popup.photo_url && (
                <img
                  src={popup.photo_url}
                  alt={popup.name}
                  className="h-20 w-full rounded-lg object-cover"
                  data-testid="popup-photo"
                />
              )}
              <p className="text-sm font-semibold leading-tight" data-testid="popup-name">
                {popup.name}
              </p>
              {typeof popup.rating === 'number' && (
                <p className="text-xs text-charcoal/60" data-testid="popup-rating">
                  ★ {popup.rating.toFixed(1)}
                </p>
              )}
              <a
                href={`/guide/${citySlug}/${categorySlug}/${popup.slug}`}
                className="mt-1 block rounded-lg bg-pine py-1.5 text-center text-xs font-bold text-white"
                data-testid="popup-link"
              >
                Voir la fiche
              </a>
            </div>
          </Popup>
        )}
      </Map>

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
