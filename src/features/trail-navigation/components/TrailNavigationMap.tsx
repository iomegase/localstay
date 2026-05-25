'use client'

import { AlertTriangle, LocateFixed, Mountain, Navigation, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import Map, { Layer, Marker, NavigationControl, Source } from 'react-map-gl/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'
import type { TrailCoordinate, TrailNavigationData } from '../types'
import { getLineEndpoints, getPositionProgress, getTrailDistanceMeters, isValidTrailGeometry } from '../lib/geo'

type GpsState = 'ready' | 'gps_prompt' | 'tracking' | 'pre_start' | 'off_track' | 'low_accuracy' | 'gps_denied'

interface Props {
  trail: TrailNavigationData
  backHref?: string
}

export function TrailNavigationMap({ trail, backHref = `/guide/${trail.slug}` }: Props) {
  const geometry = isValidTrailGeometry(trail.geometry_geojson) ? trail.geometry_geojson : null
  const endpoints = geometry ? getLineEndpoints(geometry) : null
  const mapRef = useRef<MapRef | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const hasReachedTrailRef = useRef(false)
  const [gpsState, setGpsState] = useState<GpsState>('ready')
  const [position, setPosition] = useState<TrailCoordinate | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  function startGpsTracking() {
    if (!geometry) return
    if (!('geolocation' in navigator)) {
      setGpsState('gps_denied')
      return
    }
    if (watchIdRef.current !== null) return

    setGpsState('gps_prompt')
    watchIdRef.current = navigator.geolocation.watchPosition(
      nextPosition => {
        const current = {
          latitude: nextPosition.coords.latitude,
          longitude: nextPosition.coords.longitude,
        }
        setPosition(current)
        setAccuracy(nextPosition.coords.accuracy)

        if (nextPosition.coords.accuracy > 75) {
          setGpsState('low_accuracy')
          return
        }

        const distanceToTrail = getTrailDistanceMeters(current, geometry)
        if (distanceToTrail <= 120) {
          hasReachedTrailRef.current = true
          setGpsState('tracking')
          return
        }

        setGpsState(hasReachedTrailRef.current ? 'off_track' : 'pre_start')
      },
      () => {
        setGpsState('gps_denied')
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 10_000 },
    )
  }

  function recenterOnPosition() {
    if (!position) return
    mapRef.current?.flyTo({
      center: [position.longitude, position.latitude],
      zoom: 16,
      essential: true,
    })
  }

  const progress = useMemo(() => {
    if (!position || !geometry || gpsState === 'pre_start') {
      return null
    }
    return getPositionProgress(position, geometry)
  }, [geometry, gpsState, position])

  if (!geometry || !endpoints) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] px-6 py-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#A68E69]">Randonnée</p>
        <h1 className="mt-4 font-serif text-4xl italic leading-tight text-[#121212]">{trail.name}</h1>
        <div data-testid="missing_geometry" className="mt-8 rounded-[2rem] border border-amber-200 bg-white p-5 text-sm text-charcoal/70 shadow-sm">
          <p className="font-semibold text-charcoal">Tracé indisponible</p>
          <p className="mt-2">Le mode guidage ne peut pas démarrer sans géométrie fiable validée.</p>
        </div>
      </main>
    )
  }

  const statusLabel = gpsState === 'tracking' ? 'GPS actif' : gpsStateLabel(gpsState)

  return (
    <main className="relative h-screen overflow-hidden bg-[#0f1611]" data-testid="trail-navigation-start">
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          latitude: trail.start_latitude,
          longitude: trail.start_longitude,
          zoom: 14,
        }}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />
        <Source id="trail-navigation-line" type="geojson" data={{ type: 'Feature', properties: {}, geometry }}>
          <Layer
            id="trail-line"
            type="line"
            paint={{
              'line-color': '#455E4C',
              'line-width': 5,
              'line-opacity': 0.9,
            }}
          />
        </Source>
        <Marker latitude={endpoints.start.latitude} longitude={endpoints.start.longitude} anchor="bottom">
          <span className="flex rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#455E4C] shadow">Départ</span>
        </Marker>
        <Marker latitude={endpoints.end.latitude} longitude={endpoints.end.longitude} anchor="bottom">
          <span className="flex rounded-full bg-[#455E4C] px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow">Arrivée</span>
        </Marker>
        {position && (
          <Marker latitude={position.latitude} longitude={position.longitude} anchor="center">
            <span className="block h-5 w-5 rounded-full border-2 border-white bg-blue-500 shadow-lg" />
          </Marker>
        )}
      </Map>

      <div className="absolute left-5 right-5 top-6 flex items-center justify-between">
        <Link href={backHref} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-charcoal shadow">
          <X className="h-5 w-5" />
        </Link>
        <button
          type="button"
          onClick={recenterOnPosition}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-charcoal shadow disabled:opacity-50"
          aria-label="Recentrer"
          disabled={!position}
        >
          <LocateFixed className="h-5 w-5" />
        </button>
      </div>

      <section className="absolute inset-x-4 bottom-4 rounded-[2rem] bg-[#FAF9F6]/95 p-5 shadow-2xl backdrop-blur" data-testid="trail-navigation-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#A68E69]">Guidage randonnée</p>
            <h1 className="mt-1 font-serif text-2xl italic leading-tight text-[#121212]">{trail.name}</h1>
            <p className="mt-2 text-xs text-charcoal/55">{trail.start_label ?? 'Point de départ renseigné'}</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#455E4C] shadow-sm">
            {statusLabel}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <Metric label="Distance" value={trail.distance_km ? `${trail.distance_km.toFixed(1)} km` : 'n/a'} />
          <Metric label="Durée" value={formatDuration(trail.estimated_duration_min)} />
          <Metric label="D+" value={trail.elevation_gain_m ? `${trail.elevation_gain_m} m` : 'n/a'} />
        </div>

        {gpsState === 'ready' && (
          <button
            type="button"
            onClick={startGpsTracking}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#455E4C] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-sm active:scale-[0.98] transition-transform"
          >
            <LocateFixed className="h-4 w-4" />
            Activer le suivi GPS
          </button>
        )}

        {progress && (
          <p className="mt-3 text-xs text-charcoal/60">
            Progression indicative : {Math.round(progress.percent)}% · {Math.round(progress.distance_m)} m parcourus estimés.
          </p>
        )}

        {gpsState === 'pre_start' && (
          <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs leading-5 text-charcoal/65">
            <p className="font-semibold text-charcoal">Vous n&apos;êtes pas encore au départ.</p>
            <p className="mt-1">Rejoignez le point de départ avant de suivre le tracé.</p>
            <Link href={backHref} className="mt-2 inline-flex font-bold uppercase tracking-[0.12em] text-[#455E4C]">
              Rejoindre le départ
            </Link>
          </div>
        )}

        {gpsState === 'off_track' && (
          <p className="mt-3 flex items-start gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Vous semblez vous éloigner du tracé.
          </p>
        )}

        {gpsState === 'low_accuracy' && (
          <p className="mt-3 flex items-start gap-2 rounded-2xl bg-white px-3 py-2 text-xs text-charcoal/65">
            <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-[#A68E69]" />
            Précision GPS faible{accuracy ? ` (${Math.round(accuracy)} m)` : ''}. Le guidage reste indicatif.
          </p>
        )}

        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-white px-4 py-3 text-xs leading-5 text-charcoal/60">
          <Mountain className="mt-0.5 h-4 w-4 shrink-0 text-[#455E4C]" />
          StayLocal ne remplace pas une carte officielle, la météo, le balisage terrain ou un équipement adapté.
        </p>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3">
      <p className="text-[9px] font-bold uppercase tracking-widest text-charcoal/40">{label}</p>
      <p className="mt-1 font-semibold text-charcoal">{value}</p>
    </div>
  )
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return 'n/a'
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (hours === 0) return `${remaining} min`
  if (remaining === 0) return `${hours} h`
  return `${hours} h ${remaining}`
}

function gpsStateLabel(status: GpsState): string {
  if (status === 'ready') return 'Prêt'
  if (status === 'gps_prompt') return 'GPS en attente'
  if (status === 'pre_start') return 'Pré-départ'
  if (status === 'off_track') return 'Hors tracé'
  if (status === 'low_accuracy') return 'Précision GPS faible'
  return 'GPS indisponible'
}
