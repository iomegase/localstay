'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Bus, House, Maximize2, Minimize2 } from 'lucide-react'
import Map, { Layer, Marker, Source, type MapRef } from 'react-map-gl/mapbox'
import type { PublicLine, PublicStation, PublicVehicle } from '../types'
import { useGuideMessages } from '@/features/guide-i18n/components/GuideI18nContext'

const LABEL_MIN_ZOOM = 14
const INITIAL_ZOOM = 15.3
const INITIAL_PITCH = 58

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
  focusSelected = false,
  onSelect,
}: {
  stations: PublicStation[]
  lines: PublicLine[]
  vehicles: PublicVehicle[]
  selectedId: string | null
  origin: Point | null
  focusSelected?: boolean
  onSelect: (stationId: string) => void
}) {
  const m = useGuideMessages()
  const mapRef = useRef<MapRef>(null)
  const [zoom, setZoom] = useState(INITIAL_ZOOM)
  const [fullscreen, setFullscreen] = useState(false)
  const selected = stations.find(station => station.id === selectedId) ?? null
  const center = origin ?? selected ?? stations[0] ?? null

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
    if (focusSelected && selected) mapRef.current?.flyTo({ center: [selected.longitude, selected.latitude], duration: 600 })
  }, [focusSelected, selected])

  function handleMapLoad() {
    const map = mapRef.current?.getMap()
    if (!map || map.getLayer('facilibus-3d-buildings')) return
    const labelLayerId = map.getStyle()?.layers?.find(
      layer => layer.type === 'symbol' && (layer.layout as { 'text-field'?: unknown } | undefined)?.['text-field'],
    )?.id
    map.addLayer({
      id: 'facilibus-3d-buildings',
      source: 'composite',
      'source-layer': 'building',
      filter: ['==', 'extrude', 'true'],
      type: 'fill-extrusion',
      minzoom: 14,
      paint: {
        'fill-extrusion-color': '#d9d9de',
        'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 15.5, ['get', 'height']],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': 0.85,
      },
    } as Parameters<typeof map.addLayer>[0], labelLayerId)
  }

  // Le conteneur change de taille : MapBox doit recalculer son canevas.
  useEffect(() => {
    mapRef.current?.resize()
    if (!fullscreen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

  if (!center) return null

  return (
    <div
      data-testid="facilibus-map"
      role={fullscreen ? 'dialog' : undefined}
      aria-modal={fullscreen ? true : undefined}
      aria-label={fullscreen ? m.transport.mapLabel : undefined}
      // Plein écran = tout le cadre du guide (premier ancêtre positionné), pas la fenêtre.
      className={
        fullscreen
          ? 'absolute inset-0 z-[60] bg-[#E8E6E2]'
          : 'relative h-[260px] overflow-hidden rounded-[20px] bg-[#E8E6E2] shadow-[0_1px_2px_rgba(17,17,17,0.06)]'
      }
    >
      <button
        type="button"
        onClick={() => setFullscreen(value => !value)}
        aria-label={fullscreen ? m.transport.exitFullscreen : m.transport.enterFullscreen}
        className={`absolute right-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white text-[#111111] shadow-[0_2px_8px_rgba(17,17,17,0.15)] ${
          fullscreen ? 'top-[calc(12px+env(safe-area-inset-top))]' : 'top-3'
        }`}
      >
        {fullscreen ? <Minimize2 className="h-5 w-5" aria-hidden="true" /> : <Maximize2 className="h-5 w-5" aria-hidden="true" />}
      </button>
      <Map
        ref={mapRef}
        style={{ width: '100%', height: '100%' }}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{ latitude: center.latitude, longitude: center.longitude, zoom: INITIAL_ZOOM, pitch: INITIAL_PITCH, bearing: -18 }}
        maxPitch={70}
        onLoad={handleMapLoad}
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

        {stations.map(station => {
          const isSelected = station.id === selectedId
          const showLabel = isSelected || zoom >= LABEL_MIN_ZOOM
          return (
            <Marker key={station.id} longitude={station.longitude} latitude={station.latitude} anchor="center">
              <button
                type="button"
                aria-label={m.transport.stopMarker(station.name)}
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
            // Décalée en haut à droite de sa position : l'étiquette d'un arrêt où elle
            // stationne reste lisible.
            <Marker
              key={vehicle.publicId}
              longitude={vehicle.longitude}
              latitude={vehicle.latitude}
              anchor="bottom-left"
              offset={[6, -6]}
            >
              <span
                role="img"
                aria-label={m.transport.shuttleMarker(line?.shortName ?? '')}
                className="relative flex h-8 items-center gap-1 rounded-full border-2 border-white px-2 text-[13px] font-bold shadow-[0_2px_8px_rgba(17,17,17,0.3)]"
                style={{ backgroundColor: line?.color ?? '#111111', color: line?.textColor ?? '#ffffff' }}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 animate-ping rounded-full opacity-25 motion-reduce:animate-none"
                  style={{ backgroundColor: line?.color ?? '#111111' }}
                />
                <Bus data-testid="shuttle-bus-icon" className="relative h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                {line ? <span className="relative leading-none">{line.shortName}</span> : null}
              </span>
            </Marker>
          )
        })}

        {origin ? (
          <Marker longitude={origin.longitude} latitude={origin.latitude} anchor="bottom">
            <span
              aria-label={m.transport.yourLodging}
              role="img"
              className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-[#DB2777] text-white shadow-[0_2px_8px_rgba(17,17,17,0.25)]"
            >
              <House className="h-5 w-5" aria-hidden="true" />
            </span>
          </Marker>
        ) : null}
      </Map>
    </div>
  )
}
