'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { mapsDirectionUrl } from '../lib/detail-view'

export function LodgingLocationMap({
  latitude,
  longitude,
  areaLabel,
}: {
  latitude: number
  longitude: number
  areaLabel: string | null
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''
    if (!token || !containerRef.current) return

    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [longitude, latitude],
      zoom: 13,
      attributionControl: true,
    })
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    new mapboxgl.Marker({ color: '#003A5D' }).setLngLat([longitude, latitude]).addTo(map)

    return () => map.remove()
  }, [latitude, longitude])

  return (
    <section className="mx-4 mt-6">
      <p className="mb-4 text-[14px] font-bold uppercase tracking-wider text-charcoal">Localisation</p>
      <div className="relative h-[200px] w-full overflow-hidden rounded-2xl shadow-sm">
        <div ref={containerRef} className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[1] flex items-center justify-between bg-white/85 px-3 py-2 backdrop-blur-sm">
          <span className="text-[10px] font-light uppercase tracking-widest text-gray-700">{areaLabel ?? ''}</span>
          <a
            href={mapsDirectionUrl(latitude, longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto text-[10px] font-semibold text-pink-600"
          >
            Itinéraire →
          </a>
        </div>
      </div>
    </section>
  )
}
