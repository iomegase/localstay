'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { House } from 'lucide-react'
import Map, { Layer, Marker, Source, type MapRef } from 'react-map-gl/mapbox'
import type { PublicLine, PublicStation, PublicVehicle } from '../types'

const LABEL_MIN_ZOOM = 14
const INITIAL_ZOOM = 13.5

type Point = { latitude: number; longitude: number }

/**
 * Carte du réseau Facilibus (spec 058) : arrêts nommés, tracés des lignes,
 * logement et navettes dont la position est récente. Indépendante de l'écran
 * Carte du guide (054 BR-04).
 */
export function FacilibusMap({
  stations,
  lines,
  vehicles,
  selectedId,
  origin,
  onSelect,
}: {
  stations: PublicStation[]
  lines: PublicLine[]
  vehicles: PublicVehicle[]
  selectedId: string | null
  origin: Point | null
  onSelect: (stationId: string) => void
}) {
  const mapRef = useRef<MapRef>(null)
  const [zoom, setZoom] = useState(INITIAL_ZOOM)
  const selected = stations.find(station => station.id === selectedId) ?? null
  const center = selected ?? origin ?? stations[0] ?? null

  const lineFeatures = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: lines.flatMap(line => line.paths.map(path => ({
      type: 'Feature' as const,
      properties: { color: line.color ?? '#111111' },
      geometry: { type: 'LineString' as const, coordinates: path },
    }))),
  }), [lines])

  const routeById = useMemo(() => new globalThis.Map(lines.map(line => [line.routeId, line])), [lines])
  // AC-01-04 : jamais une position ancienne ou non datée.
  const liveVehicles = vehicles.filter(vehicle => vehicle.freshness === 'fresh')

  useEffect(() => {
    if (selected) mapRef.current?.flyTo({ center: [selected.longitude, selected.latitude], duration: 600 })
  }, [selected])

  if (!center) return null

  return (
    <div className="h-[260px] overflow-hidden rounded-[20px] bg-[#E8E6E2] shadow-[0_1px_2px_rgba(17,17,17,0.06)]">
      <Map
        ref={mapRef}
        style={{ width: '100%', height: '100%' }}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{ latitude: center.latitude, longitude: center.longitude, zoom: INITIAL_ZOOM }}
        onZoom={event => setZoom(event.viewState.zoom)}
        mapStyle="mapbox://styles/mapbox/light-v11"
      >
        <Source id="facilibus-lines" type="geojson" data={lineFeatures}>
          <Layer
            id="facilibus-lines"
            type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{ 'line-color': ['get', 'color'], 'line-width': 4, 'line-opacity': 0.85 }}
          />
        </Source>

        {origin ? (
          <Marker longitude={origin.longitude} latitude={origin.latitude} anchor="bottom">
            <span
              aria-label="Votre logement"
              role="img"
              className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-[#DB2777] text-white shadow-[0_2px_8px_rgba(17,17,17,0.25)]"
            >
              <House className="h-4 w-4" aria-hidden="true" />
            </span>
          </Marker>
        ) : null}

        {stations.map(station => {
          const isSelected = station.id === selectedId
          const showLabel = isSelected || zoom >= LABEL_MIN_ZOOM
          return (
            <Marker key={station.id} longitude={station.longitude} latitude={station.latitude} anchor="center">
              <button
                type="button"
                aria-label={`Arrêt ${station.name}`}
                aria-pressed={isSelected}
                onClick={event => {
                  event.stopPropagation()
                  onSelect(station.id)
                }}
                // Étiquette au-dessus du point : le pin du logement reste visible dessous.
                className={`flex min-h-11 min-w-11 flex-col-reverse items-center justify-center ${isSelected ? 'z-10' : ''}`}
              >
                <span
                  className={`block rounded-full border-2 shadow-[0_1px_4px_rgba(17,17,17,0.3)] ${
                    isSelected ? 'h-4 w-4 border-white bg-[#111111]' : 'h-3 w-3 border-[#111111] bg-white'
                  }`}
                />
                {showLabel ? (
                  <span
                    className={`mb-1 max-w-[200px] truncate rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-[0_1px_3px_rgba(17,17,17,0.2)] ${
                      isSelected ? 'bg-[#111111] text-white' : 'bg-white text-[#111111]'
                    }`}
                  >
                    {station.name}
                  </span>
                ) : null}
              </button>
            </Marker>
          )
        })}

        {liveVehicles.map(vehicle => {
          const line = vehicle.routeId ? routeById.get(vehicle.routeId) : undefined
          return (
            <Marker key={vehicle.publicId} longitude={vehicle.longitude} latitude={vehicle.latitude} anchor="center">
              <span
                role="img"
                aria-label={`Navette ligne ${line?.shortName ?? ''}`.trim()}
                className="relative grid h-7 w-7 place-items-center rounded-full border-2 border-white text-[12px] font-bold shadow-[0_2px_8px_rgba(17,17,17,0.3)]"
                style={{ backgroundColor: line?.color ?? '#111111', color: line?.textColor ?? '#ffffff' }}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 animate-ping rounded-full opacity-30 motion-reduce:animate-none"
                  style={{ backgroundColor: line?.color ?? '#111111' }}
                />
                <span className="relative">{line?.shortName ?? '•'}</span>
              </span>
            </Marker>
          )
        })}
      </Map>
    </div>
  )
}
