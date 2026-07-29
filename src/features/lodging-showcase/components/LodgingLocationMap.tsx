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
    <section>
      <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-pink-600">
        Les alentours
      </span>
      <h2 className="mb-7 mt-2 text-[30px] font-semibold leading-[1.08] tracking-[-0.04em] text-slate-800 md:text-[36px]">
        Situer le logement.
      </h2>
      <div className="relative h-[280px] w-full overflow-hidden rounded-[24px] shadow-sm md:h-[360px]">
        <div ref={containerRef} className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[1] flex items-center justify-between bg-white/90 px-4 py-3 backdrop-blur-sm">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">{areaLabel ?? ''}</span>
          <a
            href={mapsDirectionUrl(latitude, longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto text-[11px] font-bold text-pink-600"
          >
            Itinéraire →
          </a>
        </div>
      </div>
    </section>
  )
}
