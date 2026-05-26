'use client'
import { useState, useCallback } from 'react'
import Map, { Source, Layer, Popup, NavigationControl } from 'react-map-gl/mapbox'
import type { MapMouseEvent } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { getInitialViewState, poisToGeoJson, shouldCluster } from '../lib/map-utils'
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
}

export function FullMap({ pois, cityCenter, citySlug, categorySlug }: Props) {
  const [popup, setPopup] = useState<PopupInfo | null>(null)
  const geojson = poisToGeoJson(pois)
  const cluster = shouldCluster(pois.length)

  const handleClick = useCallback((e: MapMouseEvent) => {
    const features = e.features
    if (!features || features.length === 0) {
      setPopup(null)
      return
    }
    const f = features[0]
    if (f.properties?.cluster) return
    const props = f.properties ?? {}
    const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number]
    setPopup({
      longitude: coords[0],
      latitude: coords[1],
      name: props.name,
      slug: props.slug,
      rating: props.rating,
      photo_url: props.photo_url,
    })
  }, [])

  return (
    <div className="relative h-[520px] rounded-[2.4rem] overflow-hidden" data-testid="full-map">
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={getInitialViewState(cityCenter.latitude, cityCenter.longitude)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        interactiveLayerIds={['unclustered-point']}
        onClick={handleClick}
      >
        <NavigationControl position="top-right" />

        <Source
          id="pois"
          type="geojson"
          data={geojson}
          cluster={cluster}
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          <Layer
            id="clusters"
            type="circle"
            filter={['has', 'point_count']}
            paint={{
              'circle-color': ['step', ['get', 'point_count'], '#455E4C', 10, '#A68E69'],
              'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30],
              'circle-opacity': 0.85,
            }}
          />
          <Layer
            id="cluster-count"
            type="symbol"
            filter={['has', 'point_count']}
            layout={{
              'text-field': '{point_count_abbreviated}',
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 12,
            }}
            paint={{ 'text-color': '#ffffff' }}
          />
          <Layer
            id="unclustered-point"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            paint={{
              'circle-color': '#455E4C',
              'circle-radius': 10,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
            }}
          />
        </Source>

        {popup && (
          <Popup
            longitude={popup.longitude}
            latitude={popup.latitude}
            anchor="bottom"
            onClose={() => setPopup(null)}
            closeOnClick={true}
          >
            <div className="w-48 space-y-1" data-testid="popup-content">
              {popup.photo_url && (
                <img
                  src={popup.photo_url}
                  alt={popup.name}
                  className="w-full h-20 object-cover rounded-lg"
                  data-testid="popup-photo"
                />
              )}
              <p className="font-semibold text-sm leading-tight" data-testid="popup-name">
                {popup.name}
              </p>
              {typeof popup.rating === 'number' && (
                <p className="text-xs text-charcoal/60" data-testid="popup-rating">
                  ★ {popup.rating.toFixed(1)}
                </p>
              )}
              <a
                href={`/guide/${citySlug}/${categorySlug}/${popup.slug}`}
                className="block text-center text-xs font-bold bg-pine text-white py-1.5 rounded-lg mt-1"
                data-testid="popup-link"
              >
                Voir la fiche
              </a>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
