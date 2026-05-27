'use client'

import { AlertTriangle, ChevronDown, Flag, FlagTriangleRight, LocateFixed, Mountain, Navigation, RotateCcw, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import Map, { Layer, Marker, NavigationControl, Source } from 'react-map-gl/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'
import type { TrailCoordinate, TrailNavigationData } from '../types'
import { getClosestPointOnTrail, getLineEndpoints, getPositionProgress, getTrailDistanceMeters, isValidTrailGeometry } from '../lib/geo'
import { NavigationHud } from './NavigationHud'

type GpsState = 'ready' | 'gps_prompt' | 'tracking' | 'approaching' | 'ready_to_join' | 'pre_start' | 'off_track' | 'low_accuracy' | 'gps_denied'

// Seuils GPS — précision et tolérances
const TRACKING_TOLERANCE_M = 35           // strict : sortie de tracé détectée tôt
const LOW_ACCURACY_THRESHOLD_M = 30       // alerte plus tôt qu'avant (75 m)
const JOIN_TOLERANCE_M = clampJoinTolerance(
  parseInt(process.env.NEXT_PUBLIC_JOIN_TOLERANCE_M ?? '150', 10),
)

function clampJoinTolerance(value: number): number {
  if (!Number.isFinite(value)) return 150
  return Math.max(50, Math.min(500, value))
}

interface Props {
  trail: TrailNavigationData
  backHref?: string
}

export function TrailNavigationMap({ trail, backHref = `/guide/${trail.slug}` }: Props) {
  const geometry = isValidTrailGeometry(trail.geometry_geojson) ? trail.geometry_geojson : null
  const endpoints = geometry ? getLineEndpoints(geometry) : null
  const mapRef = useRef<MapRef | null>(null)
  const watchIdRef = useRef<number | null>(null)
  // Distinction intention vs réalité :
  //   - hasIntentToJoinRef : user a cliqué "Démarrer depuis ici" OU a été détecté physiquement sur le tracé
  //   - hasPhysicallyReachedRef : distance ≤ TRACKING_TOLERANCE observée au moins une fois
  // off_track ne se déclenche qu'après une vraie atteinte physique du tracé.
  const hasIntentToJoinRef = useRef(false)
  const hasPhysicallyReachedRef = useRef(false)
  const [gpsState, setGpsState] = useState<GpsState>('ready')
  const [position, setPosition] = useState<TrailCoordinate | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [distanceToTrail, setDistanceToTrail] = useState<number | null>(null)
  const [isHudExpanded, setIsHudExpanded] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(null)
  const trackingStartedAtRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  // Mode immersif : masquer header/footer globaux pendant tout le rendu de cette page
  useEffect(() => {
    document.body.classList.add('immersive-map')
    return () => { document.body.classList.remove('immersive-map') }
  }, [])

  // Chrono : démarre au premier passage en `tracking`, tick chaque seconde
  useEffect(() => {
    if (gpsState === 'tracking' && trackingStartedAtRef.current === null) {
      trackingStartedAtRef.current = Date.now()
    }
    if (trackingStartedAtRef.current === null) return
    const tick = () => {
      const startedAt = trackingStartedAtRef.current
      if (startedAt !== null) setElapsedSeconds((Date.now() - startedAt) / 1000)
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [gpsState])

  // Auto-collapse du HUD selon l'état GPS (mode immersif sur états "en mouvement")
  useEffect(() => {
    const immersiveStates: GpsState[] = ['approaching', 'tracking', 'off_track']
    setIsHudExpanded(!immersiveStates.includes(gpsState))
  }, [gpsState])

  function tiltMapForImmersion() {
    mapRef.current?.flyTo({
      pitch: 55,
      zoom: 16,
      duration: 1500,
      essential: true,
    })
  }

  function startGpsTracking() {
    if (!geometry) return
    if (!('geolocation' in navigator)) {
      setGpsState('gps_denied')
      return
    }
    if (watchIdRef.current !== null) return

    setGpsState('gps_prompt')
    tiltMapForImmersion()
    watchIdRef.current = navigator.geolocation.watchPosition(
      nextPosition => {
        const current = {
          latitude: nextPosition.coords.latitude,
          longitude: nextPosition.coords.longitude,
        }
        setPosition(current)
        setAccuracy(nextPosition.coords.accuracy)

        if (nextPosition.coords.accuracy > LOW_ACCURACY_THRESHOLD_M) {
          setGpsState('low_accuracy')
          return
        }

        const distanceToTrail = getTrailDistanceMeters(current, geometry)
        setDistanceToTrail(distanceToTrail)

        // Sur le tracé physiquement (seuil strict) → guidage actif
        if (distanceToTrail <= TRACKING_TOLERANCE_M) {
          hasIntentToJoinRef.current = true
          hasPhysicallyReachedRef.current = true
          setGpsState('tracking')
          return
        }

        // Déjà PHYSIQUEMENT atteint le tracé et maintenant trop loin → hors piste (alerte)
        if (hasPhysicallyReachedRef.current) {
          if (typeof navigator.vibrate === 'function') navigator.vibrate(200)
          setGpsState('off_track')
          return
        }

        // User a explicitement cliqué "Démarrer depuis ici" mais n'a pas encore physiquement atteint le tracé
        if (hasIntentToJoinRef.current) {
          setGpsState('approaching')
          return
        }

        // Première approche, dans la zone d'intégration → propose démarrage ici
        if (distanceToTrail <= JOIN_TOLERANCE_M) {
          setGpsState('ready_to_join')
          return
        }

        // Trop loin pour intégrer
        setGpsState('pre_start')
      },
      () => {
        setGpsState('gps_denied')
      },
      { enableHighAccuracy: true, timeout: 6_000, maximumAge: 2_000 },
    )
  }

  function recenterOnPosition() {
    if (!position) {
      startGpsTracking()
      return
    }
    mapRef.current?.flyTo({
      center: [position.longitude, position.latitude],
      zoom: 16,
      pitch: 55,
      duration: 800,
      essential: true,
    })
  }

  function confirmJoinFromHere() {
    hasIntentToJoinRef.current = true
    setGpsState('approaching')
  }

  const progress = useMemo(() => {
    if (!position || !geometry) return null
    if (gpsState === 'pre_start' || gpsState === 'gps_denied' || gpsState === 'ready') return null
    return getPositionProgress(position, geometry)
  }, [geometry, gpsState, position])

  // Cible : point le plus proche du tracé pour l'approche
  const approachTarget = useMemo(() => {
    if (!position || !geometry) return null
    if (gpsState !== 'approaching' && gpsState !== 'ready_to_join' && gpsState !== 'pre_start') return null
    return getClosestPointOnTrail(position, geometry)
  }, [geometry, gpsState, position])

  // Segment d'approche en ligne droite (fallback toujours dispo)
  const approachLine = useMemo(() => {
    if (!position || !approachTarget) return null
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [position.longitude, position.latitude],
          [approachTarget.longitude, approachTarget.latitude],
        ],
      },
    }
  }, [position, approachTarget])

  // Itinéraire réel ORS (chemin sur routes/sentiers) — remplace le pointillé droit quand dispo
  const [walkingRoute, setWalkingRoute] = useState<{ geometry: { type: 'LineString'; coordinates: Array<[number, number]> }; distance_m: number } | null>(null)
  const lastFetchPositionRef = useRef<{ lat: number; lng: number; targetLat: number; targetLng: number } | null>(null)

  useEffect(() => {
    if (!position || !approachTarget) {
      setWalkingRoute(null)
      return
    }
    // Re-fetch seulement si la position OU la cible a bougé > 50m depuis le dernier appel
    const last = lastFetchPositionRef.current
    if (last) {
      const movedSelf = haversineMeters(position, { latitude: last.lat, longitude: last.lng })
      const movedTarget = haversineMeters(approachTarget, { latitude: last.targetLat, longitude: last.targetLng })
      if (movedSelf < 50 && movedTarget < 50) return
    }
    const controller = new AbortController()
    const debounceId = window.setTimeout(async () => {
      try {
        const res = await fetch('/api/trails/walking-route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: [position.longitude, position.latitude],
            to: [approachTarget.longitude, approachTarget.latitude],
          }),
          signal: controller.signal,
        })
        if (!res.ok) return
        const json = (await res.json()) as { data?: { geometry: { type: 'LineString'; coordinates: Array<[number, number]> }; distance_m: number } | null }
        if (json.data) {
          setWalkingRoute({ geometry: json.data.geometry, distance_m: json.data.distance_m })
          lastFetchPositionRef.current = {
            lat: position.latitude,
            lng: position.longitude,
            targetLat: approachTarget.latitude,
            targetLng: approachTarget.longitude,
          }
        }
      } catch {
        // Silent : fallback sur pointillé droit
      }
    }, 600)
    return () => {
      controller.abort()
      window.clearTimeout(debounceId)
    }
  }, [position, approachTarget])

  // Cercle d'incertitude GPS (accuracy en mètres)
  const accuracyCircle = useMemo(() => {
    if (!position || !accuracy) return null
    return {
      type: 'Feature' as const,
      properties: { accuracy },
      geometry: { type: 'Point' as const, coordinates: [position.longitude, position.latitude] },
    }
  }, [accuracy, position])

  // Détection rando en boucle : start et end ≤ 50m → un seul marqueur fusionné
  const isLoopTrail = useMemo(() => {
    if (!endpoints) return false
    return haversineMeters(endpoints.start, endpoints.end) <= 50
  }, [endpoints])

  // Couleur du marker selon l'état
  const markerColor = useMemo(() => {
    if (gpsState === 'off_track') return '#DC2626' // rouge
    if (gpsState === 'tracking') return '#16A34A'  // vert
    if (gpsState === 'approaching') return '#F59E0B' // ambre
    return '#2563EB' // bleu (ready_to_join, autres)
  }, [gpsState])

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
        {isLoopTrail ? (
          <Marker latitude={endpoints.start.latitude} longitude={endpoints.start.longitude} anchor="bottom">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#455E4C] text-white shadow-lg" aria-label="Départ et arrivée (boucle)">
              <RotateCcw className="h-4 w-4" />
            </span>
          </Marker>
        ) : (
          <>
            <Marker latitude={endpoints.start.latitude} longitude={endpoints.start.longitude} anchor="bottom">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow-lg" aria-label="Départ">
                <Flag className="h-4 w-4" />
              </span>
            </Marker>
            <Marker latitude={endpoints.end.latitude} longitude={endpoints.end.longitude} anchor="bottom">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#1F2937] text-white shadow-lg" aria-label="Arrivée">
                <FlagTriangleRight className="h-4 w-4" />
              </span>
            </Marker>
          </>
        )}
        {accuracyCircle && (
          <Source id="accuracy-circle" type="geojson" data={accuracyCircle}>
            <Layer
              id="accuracy-circle-fill"
              type="circle"
              paint={{
                'circle-radius': [
                  'interpolate',
                  ['exponential', 2],
                  ['zoom'],
                  // À zoom Z, 1m ≈ pixels selon résolution Mercator à 45° lat ≈ 156543.03 * cos(lat) / 2^z
                  10, ['/', ['get', 'accuracy'], 108],
                  15, ['/', ['get', 'accuracy'], 3.4],
                  18, ['/', ['get', 'accuracy'], 0.42],
                  22, ['/', ['get', 'accuracy'], 0.026],
                ],
                'circle-color': markerColor,
                'circle-opacity': 0.12,
                'circle-stroke-color': markerColor,
                'circle-stroke-opacity': 0.4,
                'circle-stroke-width': 1,
              }}
            />
          </Source>
        )}
        {/* Pointillé droit (fallback toujours visible quand pas de route ORS) */}
        {approachLine && !walkingRoute && (
          <Source id="approach-line" type="geojson" data={approachLine}>
            <Layer
              id="approach-line-layer"
              type="line"
              paint={{
                'line-color': markerColor,
                'line-width': 3,
                'line-dasharray': [2, 2],
                'line-opacity': 0.7,
              }}
            />
          </Source>
        )}
        {/* Vrai itinéraire de marche ORS — suit les routes & sentiers */}
        {walkingRoute && (
          <Source id="walking-route" type="geojson" data={{ type: 'Feature', properties: {}, geometry: walkingRoute.geometry }}>
            <Layer
              id="walking-route-halo"
              type="line"
              paint={{
                'line-color': '#ffffff',
                'line-width': 8,
                'line-opacity': 0.7,
              }}
            />
            <Layer
              id="walking-route-line"
              type="line"
              paint={{
                'line-color': '#6366F1',
                'line-width': 5,
                'line-opacity': 0.95,
              }}
            />
          </Source>
        )}
        {position && (
          <Marker latitude={position.latitude} longitude={position.longitude} anchor="center">
            <span className="relative flex h-7 w-7 items-center justify-center">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                style={{ backgroundColor: markerColor }}
              />
              <span
                className="relative inline-flex h-5 w-5 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: markerColor }}
              />
            </span>
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
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-charcoal shadow"
          aria-label={position ? 'Recentrer sur ma position' : 'Activer la localisation'}
        >
          <LocateFixed className={`h-5 w-5 ${!position ? 'animate-pulse text-[#455E4C]' : ''}`} />
        </button>
      </div>

      {!isHudExpanded && (
        <NavigationHud
          statusColor={markerColor}
          statusLabel={gpsState === 'tracking' ? 'GPS actif' : gpsStateLabel(gpsState)}
          distanceRemainingKm={
            progress && trail.distance_km
              ? Math.max(0, trail.distance_km - progress.distance_m / 1000)
              : trail.distance_km
          }
          progressPercent={progress ? progress.percent : null}
          elapsedSeconds={elapsedSeconds}
          pulse={gpsState === 'off_track'}
          onExpand={() => setIsHudExpanded(true)}
        />
      )}

      <section
        className={`absolute inset-x-4 bottom-4 rounded-[2rem] bg-[#FAF9F6]/95 p-5 shadow-2xl backdrop-blur transition-opacity ${isHudExpanded ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        data-testid="trail-navigation-panel"
        aria-hidden={!isHudExpanded}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#A68E69]">Guidage randonnée</p>
            <h1 className="mt-1 font-serif text-2xl italic leading-tight text-[#121212]">{trail.name}</h1>
            <p className="mt-2 text-xs text-charcoal/55">{trail.start_label ?? 'Point de départ renseigné'}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#455E4C] shadow-sm">
              {statusLabel}
            </span>
            {(gpsState === 'approaching' || gpsState === 'tracking' || gpsState === 'off_track') && (
              <button
                type="button"
                onClick={() => setIsHudExpanded(false)}
                aria-label="Mode immersif"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-charcoal shadow-sm active:scale-95 transition-transform"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            )}
          </div>
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

        {gpsState === 'ready_to_join' && (
          <div className="mt-3 rounded-2xl bg-[#F2F5EF] px-4 py-3 text-xs leading-5 text-charcoal/75">
            <p className="font-semibold text-charcoal">
              Vous êtes à {distanceToTrail ? Math.round(distanceToTrail) : '?'} m du tracé.
            </p>
            {progress && (
              <p className="mt-1">
                Point d&apos;entrée estimé : <strong>{Math.round(progress.percent)}%</strong> du parcours
                ({Math.round(progress.distance_m)} m parcourus si vous démarrez ici).
              </p>
            )}
            <button
              type="button"
              onClick={confirmJoinFromHere}
              className="mt-3 w-full rounded-full bg-[#455E4C] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-sm active:scale-[0.98] transition-transform"
            >
              Démarrer depuis ici
            </button>
          </div>
        )}

        {gpsState === 'pre_start' && (
          <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs leading-5 text-charcoal/65">
            <p className="font-semibold text-charcoal">
              Vous êtes à {distanceToTrail ? Math.round(distanceToTrail) : '?'} m du tracé
              {walkingRoute && (
                <span className="font-normal text-charcoal/55"> ({Math.round(walkingRoute.distance_m)} m à pied par les chemins)</span>
              )}.
            </p>
            <p className="mt-1">
              Rapprochez-vous à moins de {JOIN_TOLERANCE_M} m pour démarrer le guidage — vous pourrez démarrer
              <strong> en n&apos;importe quel point</strong> du tracé, pas obligatoirement au début.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${trail.start_latitude},${trail.start_longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#455E4C] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-sm active:scale-[0.98] transition-transform"
              >
                <Navigation className="h-4 w-4" />
                Me guider vers le départ
              </a>
              <Link href={backHref} className="text-center text-[11px] font-bold uppercase tracking-[0.12em] text-charcoal/60">
                Voir la fiche du tracé
              </Link>
            </div>
          </div>
        )}

        {gpsState === 'approaching' && (
          <div className="mt-3 rounded-2xl bg-[#F2F5EF] px-4 py-3 text-xs leading-5 text-charcoal/75">
            <p className="font-semibold text-charcoal flex items-center gap-2">
              <Navigation className="h-4 w-4 text-[#455E4C]" />
              En route vers le tracé.
            </p>
            <p className="mt-1">
              Encore <strong>{distanceToTrail ? Math.round(distanceToTrail) : '?'} m</strong>. Le guidage actif démarrera dès que vous serez sur le sentier.
            </p>
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

function haversineMeters(a: TrailCoordinate, b: TrailCoordinate): number {
  const R = 6_371_000
  const lat1 = (a.latitude * Math.PI) / 180
  const lat2 = (b.latitude * Math.PI) / 180
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function gpsStateLabel(status: GpsState): string {
  if (status === 'ready') return 'Prêt'
  if (status === 'gps_prompt') return 'GPS en attente'
  if (status === 'ready_to_join') return 'Prêt à intégrer'
  if (status === 'approaching') return 'Approche du tracé'
  if (status === 'pre_start') return 'Trop loin du tracé'
  if (status === 'off_track') return 'Hors tracé'
  if (status === 'low_accuracy') return 'Précision GPS faible'
  return 'GPS indisponible'
}
