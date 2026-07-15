'use client'

import { AlertTriangle, ChevronDown, Compass, Flag, FlagTriangleRight, LocateFixed, Navigation, RotateCcw, Square, Unlock, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, { Layer, Marker, NavigationControl, Source } from 'react-map-gl/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'
import type { TrailCoordinate, TrailGpsHealth, TrailNavigationData, TrailSessionPhase } from '../types'
import { getLineEndpoints, getPositionProgress, getTrailDistanceMeters, haversineMeters, isValidTrailGeometry, shouldAutoFollowCamera, smoothTrack } from '../lib/geo'
import { SESSION_START_MAX_DISTANCE_M } from '../lib/session-stats'
import { useTrailNavigationSession } from '../hooks/useTrailNavigationSession'
import { reliabilityFromQualityStatus } from '@/features/trails-acquisition/lib/geometry-quality'
import { NavigationHud } from './NavigationHud'
import { TrailSessionSummaryModal } from './TrailSessionSummaryModal'

const POSITION_BLUE = '#2563EB'

interface Props {
  trail: TrailNavigationData
  backHref?: string
  /**
   * Si fourni, les boutons de fermeture appellent ce callback au lieu de revenir dans
   * l'historique. Utilisé par le modal intercepté pour réinitialiser le slot @modal.
   */
  onClose?: () => void
}

export function TrailNavigationMap({ trail, backHref = `/guide/${trail.slug}`, onClose }: Props) {
  return (
    <TrailNavigationSessionMap
      key={trail.id}
      trail={trail}
      backHref={backHref}
      onClose={onClose}
    />
  )
}

function TrailNavigationSessionMap({ trail, backHref = `/guide/${trail.slug}`, onClose }: Props) {
  const router = useRouter()
  const geometry = isValidTrailGeometry(trail.geometry_geojson) ? trail.geometry_geojson : null
  const endpoints = geometry ? getLineEndpoints(geometry) : null
  const isIndicativeTrail = reliabilityFromQualityStatus(trail.data_quality_status) === 'indicative'
  const mapRef = useRef<MapRef | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const stopGpsTracking = useCallback(() => {
    const watchId = watchIdRef.current
    if (watchId === null) return
    watchIdRef.current = null
    if (!('geolocation' in navigator)) return
    try {
      navigator.geolocation.clearWatch(watchId)
    } catch {
      // Some browser implementations can throw while clearing an already-ended watcher.
      // The local session is already frozen, so cleanup must not block its summary.
    }
  }, [])
  const session = useTrailNavigationSession({ stopGps: stopGpsTracking })
  const sessionActionsRef = useRef({
    receiveGpsPosition: session.receiveGpsPosition,
    markGpsDenied: session.markGpsDenied,
    markGpsUnavailable: session.markGpsUnavailable,
  })
  sessionActionsRef.current = {
    receiveGpsPosition: session.receiveGpsPosition,
    markGpsDenied: session.markGpsDenied,
    markGpsUnavailable: session.markGpsUnavailable,
  }
  const [position, setPosition] = useState<TrailCoordinate | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [isHudExpanded, setIsHudExpanded] = useState(false)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const closeControlRef = useRef<HTMLElement | null>(null)
  const shouldFocusCloseControlRef = useRef(false)
  const [northLocked, setNorthLocked] = useState(true)
  const hasManualHudPreferenceRef = useRef(false)
  // Suivi caméra : en mode marche actif, la position utilisateur reste au centre.
  // Le bouton recentrer force aussi un retour immédiat sur la dernière position GPS.
  const [isFollowing, setIsFollowing] = useState(true)

  useEffect(() => {
    return stopGpsTracking
  }, [stopGpsTracking])

  // Mode immersif : masquer header/footer globaux pendant tout le rendu de cette page
  useEffect(() => {
    document.body.classList.add('immersive-map')
    return () => { document.body.classList.remove('immersive-map') }
  }, [])

  useEffect(() => {
    if (isSummaryOpen || !shouldFocusCloseControlRef.current) return
    const frame = window.requestAnimationFrame(() => {
      shouldFocusCloseControlRef.current = false
      closeControlRef.current?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [isSummaryOpen])

  // Auto-collapse du HUD selon l'état GPS (mode immersif sur états "en mouvement")
  useEffect(() => {
    if (hasManualHudPreferenceRef.current) return
    const immersivePhases: TrailSessionPhase[] = ['approaching', 'tracking']
    setIsHudExpanded(!immersivePhases.includes(session.phase))
  }, [session.phase])

  function setHudExpandedFromUser(expanded: boolean) {
    hasManualHudPreferenceRef.current = true
    setIsHudExpanded(expanded)
  }

  // Application du verrouillage nord sur le map ref (drag rotate + twist 2-doigts).
  // Au unlock on laisse l'utilisateur libre ; au lock on remet la boussole à zéro.
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    if (northLocked) {
      map.dragRotate.disable()
      map.touchZoomRotate.disableRotation()
      map.easeTo({ bearing: 0, duration: 400 })
    } else {
      map.dragRotate.enable()
      map.touchZoomRotate.enableRotation()
    }
  }, [northLocked])

  function toggleNorthLock() {
    setNorthLocked(prev => !prev)
  }

  // Suivi caméra continu : recentre la carte sur la position à chaque update GPS,
  // en conservant zoom / pitch / bearing courants.
  useEffect(() => {
    if (!position) return
    if (!shouldAutoFollowCamera(session.phase, isFollowing)) return
    mapRef.current?.getMap()?.easeTo({
      center: [position.longitude, position.latitude],
      duration: 700,
      essential: true,
    })
  }, [position, isFollowing, session.phase])

  function tiltMapForImmersion() {
    mapRef.current?.flyTo({
      pitch: 55,
      zoom: 16,
      duration: 1500,
      essential: true,
    })
  }

  const startGpsTracking = useCallback(() => {
    if (!geometry) return
    if (!('geolocation' in navigator)) {
      session.markGpsUnavailable()
      return
    }
    if (watchIdRef.current !== null) return

    session.markGpsPrompting()
    setIsFollowing(true)
    tiltMapForImmersion()
    watchIdRef.current = navigator.geolocation.watchPosition(
      nextPosition => {
        const current = {
          latitude: nextPosition.coords.latitude,
          longitude: nextPosition.coords.longitude,
        }
        setPosition(current)
        setAccuracy(nextPosition.coords.accuracy)
        const distanceToTrailM = getTrailDistanceMeters(current, geometry)
        sessionActionsRef.current.receiveGpsPosition(nextPosition, distanceToTrailM)
      },
      error => {
        if (error.code === error.PERMISSION_DENIED) {
          sessionActionsRef.current.markGpsDenied()
          return
        }
        sessionActionsRef.current.markGpsUnavailable()
      },
      { enableHighAccuracy: true, timeout: 6_000, maximumAge: 2_000 },
    )
  }, [geometry, session.markGpsPrompting, session.markGpsUnavailable])

  function recenterOnPosition() {
    if (!position) return
    setIsFollowing(true)
    mapRef.current?.flyTo({
      center: [position.longitude, position.latitude],
      zoom: 17.5,
      pitch: 55,
      duration: 800,
      essential: true,
    })
  }

  const progress = useMemo(() => {
    if (!position || !geometry) return null
    if (session.phase === 'pre_start' || session.phase === 'idle') return null
    return getPositionProgress(position, geometry)
  }, [geometry, position, session.phase])

  // Cercle d'incertitude GPS (accuracy en mètres)
  const accuracyCircle = useMemo(() => {
    if (!position || !accuracy) return null
    return {
      type: 'Feature' as const,
      properties: { accuracy },
      geometry: { type: 'Point' as const, coordinates: [position.longitude, position.latitude] },
    }
  }, [accuracy, position])

  const userTrackLine = useMemo(() => {
    if (session.points.length < 2) return null
    const coordinates = sampleBreadcrumbPoints(session.points)
      .map(point => [point.longitude, point.latitude] as [number, number])
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates: smoothTrack(coordinates) },
    }
  }, [session.points.length])

  // Détection rando en boucle : start et end ≤ 50m → un seul marqueur fusionné
  const isLoopTrail = useMemo(() => {
    if (!endpoints) return false
    return haversineMeters(endpoints.start, endpoints.end) <= 50
  }, [endpoints])

  // Couleur du marker selon l'état
  const markerColor = useMemo(() => {
    if (session.isOffTrack) return '#DC2626'
    if (session.phase === 'tracking') return '#16A34A'
    if (session.phase === 'approaching') return '#F59E0B'
    return '#2563EB' // bleu (ready_to_join, autres)
  }, [session.isOffTrack, session.phase])

  const closeNavigation = useCallback(() => {
    if (onClose) {
      onClose()
      return
    }
    router.back()
  }, [onClose, router])

  if (!geometry || !endpoints) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-[430px] bg-[#FAF9F6] px-6 py-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#db2777]">Randonnée</p>
        <h1 className="mt-4 font-serif text-4xl italic leading-tight text-[#121212]">{trail.name}</h1>
        <div data-testid="missing_geometry" className="mt-8 rounded-[2rem] border border-amber-200 bg-white p-5 text-sm text-charcoal/70 shadow-sm">
          <p className="font-semibold text-charcoal">Tracé indisponible</p>
          <p className="mt-2">Le mode guidage ne peut pas démarrer sans géométrie fiable validée.</p>
        </div>
      </main>
    )
  }

  const statusLabel = sessionPhaseLabel(session.phase)
  const healthLabel = gpsHealthLabel(session.gpsHealth)
  const hasSessionMetrics = session.isActive || session.phase === 'stopped'
  const displayedDistance = hasSessionMetrics
    ? `${(session.distanceM / 1000).toFixed(2)} km`
    : trail.distance_km !== null
      ? `${trail.distance_km.toFixed(1)} km`
      : 'n/a'
  const displayedDuration = session.elapsedSeconds !== null
    ? formatElapsedSeconds(session.elapsedSeconds)
    : formatDuration(trail.estimated_duration_min)
  const setCloseControlRef = (node: HTMLElement | null) => {
    closeControlRef.current = node
  }
  const closeControl = (
    <button
      ref={setCloseControlRef}
      type="button"
      onClick={closeNavigation}
      aria-label="Fermer"
      className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-charcoal shadow"
    >
      <X className="h-5 w-5" />
    </button>
  )

  function stopSessionAndOpenSummary() {
    const frozen = session.stopSession()
    if (frozen !== null) setIsSummaryOpen(true)
  }

  function closeSummaryAndFocusMapControl() {
    shouldFocusCloseControlRef.current = true
    setIsSummaryOpen(false)
  }

  return (
    <main className="relative mx-auto h-screen w-full max-w-[430px] overflow-hidden bg-[#0f1611]" data-testid="trail-navigation-start">
      {isIndicativeTrail && (
        <div
          data-testid="trail-indicative-banner"
          className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]"
        >
          <div className="flex items-center gap-2 rounded-full bg-amber-50/95 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-amber-700 shadow-md ring-1 ring-amber-200">
            <AlertTriangle className="h-3.5 w-3.5" />
            Tracé indicatif — suivez le balisage
          </div>
        </div>
      )}
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          latitude: trail.start_latitude,
          longitude: trail.start_longitude,
          zoom: 14,
          bearing: 0,
        }}
        // Le verrouillage nord est toggle-able via le bouton compass. État appliqué
        // dans le useEffect ci-dessous, qui réagit à `northLocked`.
        touchPitch={true}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Décalé vers le bas pour passer sous la rangée de boutons du haut (compass/lock). */}
        <NavigationControl position="top-right" style={{ marginTop: '5.5rem', marginRight: '1.5rem' }} />
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
                'circle-color': POSITION_BLUE,
                'circle-opacity': 0.12,
                'circle-stroke-color': POSITION_BLUE,
                'circle-stroke-opacity': 0.4,
                'circle-stroke-width': 1,
              }}
            />
          </Source>
        )}
        {/* Tracé réellement parcouru — distinct du GPX officiel (vert).
            Casing blanc + cœur bleu pour rester lisible sur fond terrain. */}
        {userTrackLine && (
          <Source id="user-track-line" type="geojson" data={userTrackLine}>
            <Layer
              id="user-track-halo"
              type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.85 }}
            />
            <Layer
              id="user-track-layer"
              type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{ 'line-color': POSITION_BLUE, 'line-width': 4, 'line-opacity': 0.95 }}
            />
          </Source>
        )}
        {position && (
          <Marker latitude={position.latitude} longitude={position.longitude} anchor="center">
            {/* « Ma position » façon Google Maps : point bleu fixe à contour blanc.
                Le halo de précision (cercle métrique) est géré par le layer accuracy-circle. */}
            <span
              className="block h-[18px] w-[18px] rounded-full border-[3px] border-white"
              style={{
                backgroundColor: markerColor,
                boxShadow: `0 0 0 2px ${markerColor}55, 0 2px 8px rgba(0,0,0,0.35)`,
              }}
              aria-label="Ma position"
            />
          </Marker>
        )}
      </Map>

      <div
        data-testid="trail-top-controls"
        className="pointer-events-none absolute left-5 right-5 top-6 z-30 flex items-center justify-between"
      >
        {session.isActive ? (
          <button
            type="button"
            onClick={stopSessionAndOpenSummary}
            aria-label="Stop"
            className="pointer-events-auto flex h-11 items-center justify-center gap-2 rounded-full bg-red-600 px-4 text-xs font-bold uppercase tracking-wider text-white shadow"
          >
            <Square className="h-3.5 w-3.5" fill="currentColor" />
            Stop
          </button>
        ) : closeControl}
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            type="button"
            onClick={toggleNorthLock}
            className={`flex h-11 w-11 items-center justify-center rounded-full shadow transition-colors ${
              northLocked
                ? 'bg-white/90 text-charcoal'
                : 'bg-amber-400 text-white'
            }`}
            aria-pressed={northLocked}
            aria-label={northLocked ? 'Déverrouiller la rotation (nord libre)' : 'Verrouiller le nord en haut'}
            title={northLocked ? 'Nord verrouillé — tap pour libérer la rotation' : 'Rotation libre — tap pour reverrouiller le nord'}
          >
            {northLocked ? <Compass className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={recenterOnPosition}
            disabled={position === null}
            aria-pressed={isFollowing && !!position}
            className={`flex h-11 w-11 items-center justify-center rounded-full shadow transition-colors ${
              isFollowing && position ? 'bg-[#455E4C] text-white' : 'bg-white/90 text-charcoal'
            }`}
            aria-label={
              position
                ? 'Recentrer sur ma position'
                : 'Position indisponible'
            }
          >
            <LocateFixed className={`h-5 w-5 ${!position ? 'animate-pulse text-[#455E4C]' : ''}`} />
          </button>
        </div>
      </div>

      {!isHudExpanded && (
        <NavigationHud
          statusColor={markerColor}
          healthColor={gpsHealthColor(session.gpsHealth)}
          healthLabel={healthLabel}
          statusLabel={statusLabel}
          distanceKm={hasSessionMetrics ? session.distanceM / 1000 : trail.distance_km}
          entryProgressPercent={session.phase === 'ready_to_join' && progress ? progress.percent : null}
          elapsedSeconds={session.elapsedSeconds}
          pulse={session.isOffTrack}
          onExpand={() => setHudExpandedFromUser(true)}
        />
      )}

      <section
        className={`absolute inset-x-4 bottom-4 rounded-md bg-white/95 p-5 shadow-2xl backdrop-blur transition-opacity ${isHudExpanded ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        data-testid="trail-navigation-panel"
        aria-hidden={!isHudExpanded}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {/* <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#db2777]">Guidage randonnée</p> */}
            <h1 className="mt-1 uppercase text-xlleading-tight text-[#121212]">{trail.name}</h1>
            <p className="mt-2 text-xs text-charcoal/55">{trail.start_label ?? 'Point de départ renseigné'}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-charcoal/70">{statusLabel}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#455E4C] shadow-sm"
              aria-label={healthLabel}
            >
              {healthLabel}
              <span
                data-testid="gps-health-dot"
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: gpsHealthColor(session.gpsHealth) }}
                aria-label={healthLabel}
                title={healthLabel}
              />
            </span>
            <button
              type="button"
              onClick={() => setHudExpandedFromUser(false)}
              aria-label="Réduire le panneau"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-charcoal shadow-sm active:scale-95 transition-transform"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className={`mt-4 grid gap-2 text-center text-xs ${hasSessionMetrics ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <Metric label="Distance" value={displayedDistance} />
          <Metric label="Durée" value={displayedDuration} />
          {!hasSessionMetrics && (
            <Metric label="D+" value={trail.elevation_gain_m ? `${trail.elevation_gain_m} m` : 'n/a'} />
          )}
        </div>

        {session.gpsHealth === 'inactive' && (
          <button
            type="button"
            onClick={startGpsTracking}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#455E4C] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-sm active:scale-[0.98] transition-transform"
          >
            <LocateFixed className="h-4 w-4" />
            Activer le suivi GPS
          </button>
        )}

        {session.phase === 'ready_to_join' && session.canStart && (
          <div className="mt-3 rounded-2xl bg-[#F2F5EF] px-4 py-3 text-xs leading-5 text-charcoal/75">
            <p className="font-semibold text-charcoal">
              Vous êtes à {session.distanceToTrailM !== null ? Math.round(session.distanceToTrailM) : '?'} m du tracé.
            </p>
            {progress && (
              <p className="mt-1">
                Point d&apos;entrée estimé : <strong>{Math.round(progress.percent)}%</strong> du parcours.
              </p>
            )}
            <button
              type="button"
              onClick={session.startSession}
              className="mt-3 w-full rounded-full bg-[#455E4C] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-sm active:scale-[0.98] transition-transform"
            >
              Démarrer ici
            </button>
          </div>
        )}

        {session.phase === 'pre_start' && (
          <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs leading-5 text-charcoal/65">
            <p className="font-semibold text-red-600">
              Vous êtes à {session.distanceToTrailM !== null ? Math.round(session.distanceToTrailM) : '?'} m du tracé.
            </p>
            <p className="mt-1">
              Rapprochez-vous à {SESSION_START_MAX_DISTANCE_M} m ou moins pour démarrer le guidage — vous pourrez démarrer
              <strong> en n&apos;importe quel point</strong> du tracé, pas obligatoirement au début.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${trail.start_latitude},${trail.start_longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 border-b-black border  bg-gray-200 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-black/70 shadow-sm active:scale-[0.98] transition-transform"
              >
                <Navigation className="h-4 w-4" />
              Rejoindre point de départ
              </a>
              {onClose ? (
                <button type="button" onClick={onClose} className="text-center text-[11px] font-bold uppercase tracking-[0.12em] text-charcoal/60">
                  Fermer
                </button>
              ) : (
                <Link href={backHref} className="text-center text-[11px] font-bold uppercase tracking-[0.12em] text-charcoal/60">
                  Fermer
                </Link>
              )}
            </div>
          </div>
        )}

        {session.phase === 'approaching' && (
          <div className="mt-3 rounded-2xl bg-[#F2F5EF] px-4 py-3 text-xs leading-5 text-charcoal/75">
            <p className="font-semibold text-charcoal flex items-center gap-2">
              <Navigation className="h-4 w-4 text-[#455E4C]" />
              En route vers le tracé.
            </p>
            <p className="mt-1">
              Encore <strong>{session.distanceToTrailM !== null ? Math.round(session.distanceToTrailM) : '?'} m</strong>. Le guidage actif démarrera dès que vous serez sur le sentier.
            </p>
          </div>
        )}

        {session.isOffTrack && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Vous semblez vous éloigner du tracé.
          </div>
        )}

        {session.gpsHealth === 'low_accuracy' && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-white px-3 py-2 text-xs text-charcoal/65">
            <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-[#db2777]" />
            Précision GPS faible{accuracy ? ` (${Math.round(accuracy)} m)` : ''}. Le guidage reste indicatif.
          </div>
        )}

        {(session.gpsHealth === 'denied' || session.gpsHealth === 'unavailable') && (
          <div
            role="status"
            className="mt-3 flex items-start gap-2 rounded-2xl bg-red-50 px-3 py-2 text-xs text-red-800"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <strong>{healthLabel}</strong>.
              {session.isActive
                ? ' La session continue avec les statistiques déjà acquises. Stop reste disponible.'
                : ' Le tracé reste consultable sans suivi en direct.'}
            </p>
          </div>
        )}

        {/* <div className="mt-4 flex items-start gap-2 justify-center rounded-2xl bg-white px-4 py-3 text-xs leading-5 text-charcoal/60">
          <Mountain className="mt-0.5 h-4 w-4 shrink-0 text-[#455E4C]" />
          <p className="text-[10px] leading-5 tracking-wide text-charcoal/90">
            MyStay ne remplace pas une carte officielle, la météo, le balisage terrain ou un équipement adapté.
          </p>
        </div> */}
      </section>
      {isSummaryOpen && session.summary && (
        <TrailSessionSummaryModal
          summary={session.summary}
          onViewTrail={closeSummaryAndFocusMapControl}
          {...(onClose ? { onExit: onClose } : { exitHref: backHref })}
        />
      )}
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white px-3 py-3 drop-shadow-sm">
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

function formatElapsedSeconds(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60)
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours} h ${minutes.toString().padStart(2, '0')} min`
}

// Santé du signal GPS résumée en feu tricolore (indépendant de l'état de navigation,
// qui reste véhiculé par les blocs et le marqueur carte).
function gpsHealthColor(health: TrailGpsHealth): string {
  if (health === 'denied' || health === 'unavailable') return '#DC2626'
  if (health === 'inactive' || health === 'prompting' || health === 'low_accuracy') return '#F59E0B'
  return '#16A34A'
}

export function gpsHealthLabel(health: TrailGpsHealth): string {
  if (health === 'inactive') return 'GPS inactif'
  if (health === 'prompting') return 'Recherche GPS'
  if (health === 'good') return 'Signal GPS fiable'
  if (health === 'low_accuracy') return 'Précision GPS faible'
  if (health === 'denied') return 'Accès GPS refusé'
  return 'Signal GPS indisponible'
}

export function sampleBreadcrumbPoints<T>(
  points: readonly T[],
  maximumPoints = 500,
): readonly T[] {
  if (!Number.isInteger(maximumPoints) || maximumPoints < 2) {
    throw new RangeError('maximumPoints must be an integer of at least 2')
  }
  if (points.length <= maximumPoints) return points

  return Array.from({ length: maximumPoints }, (_, index) => {
    const sourceIndex = Math.round((index * (points.length - 1)) / (maximumPoints - 1))
    return points[sourceIndex]
  })
}

function sessionPhaseLabel(phase: TrailSessionPhase): string {
  if (phase === 'ready_to_join') return 'Prêt à démarrer'
  if (phase === 'approaching') return 'Approche du tracé'
  if (phase === 'tracking') return 'Suivi du tracé'
  if (phase === 'pre_start') return 'Trop loin du tracé'
  if (phase === 'stopped') return 'Session arrêtée'
  return 'Prêt'
}
