'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { circlePolygon, type ApproximateLocation } from '../lib/approximate-location'
import { addBuildings3d, LODGING_MAP_PITCH } from '../lib/map-3d'
import { MapFullscreenButton, mapFrameClass, useMapFullscreen } from './MapFullscreen'

/**
 * Spec 088 : petite carte de la zone du logement — cercle approximatif, sans repère exact
 * ni itinéraire (l'adresse précise est réservée au guide des voyageurs).
 */
export function LodgingAreaMap({ location, areaLabel }: { location: ApproximateLocation; areaLabel: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const { expanded, toggle } = useMapFullscreen()

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''
    if (!token || !containerRef.current) return

    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [location.longitude, location.latitude],
      zoom: 16,
      pitch: LODGING_MAP_PITCH,
      // BR-01 : la page défile, la carte ne capte pas la molette.
      scrollZoom: false,
      attributionControl: true,
    })
    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right')
    map.on('load', () => {
      addBuildings3d(map)
      map.addSource('lodging-area', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [circlePolygon(location, location.radius_m)] },
        },
      })
      map.addLayer({ id: 'lodging-area-fill', type: 'fill', source: 'lodging-area', paint: { 'fill-color': '#DB2777', 'fill-opacity': 0.16 } })
      map.addLayer({ id: 'lodging-area-line', type: 'line', source: 'lodging-area', paint: { 'line-color': '#DB2777', 'line-width': 2, 'line-opacity': 0.6 } })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [location])

  // BR-03 : en plein écran, la molette zoome ; la carte se redimensionne au changement de cadre.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (expanded) map.scrollZoom.enable()
    else map.scrollZoom.disable()
    const frame = requestAnimationFrame(() => map.resize())
    return () => cancelAnimationFrame(frame)
  }, [expanded])

  return (
    <section data-testid="lodging-area-map">
      <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-pink-600">Les alentours</span>
      <h2 className="mb-7 mt-2 text-[30px] font-semibold leading-[1.08] tracking-[-0.04em] text-slate-800 md:text-[36px]">
        Situer le logement.
      </h2>
      <div data-testid="lodging-map-frame" className={mapFrameClass(expanded, 'relative h-[260px] w-full overflow-hidden rounded-[24px] shadow-sm')}>
        <MapFullscreenButton expanded={expanded} onToggle={toggle} />
        <div ref={containerRef} className="absolute inset-0 h-full w-full" aria-label={`Zone du logement : ${areaLabel}`} role="img" />
      </div>
    </section>
  )
}
