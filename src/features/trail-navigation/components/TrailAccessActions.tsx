'use client'

import Link from 'next/link'
import { ChevronRight, LocateFixed, Navigation, PlayCircle } from 'lucide-react'
import { useState } from 'react'

type AccessState =
  | { status: 'idle' }
  | { status: 'gps_prompt' }
  | { status: 'route_ready'; origin: { latitude: number; longitude: number } }
  | { status: 'gps_denied' }

interface Props {
  citySlug: string
  trailSlug: string
  startLabel: string | null
  startLatitude: number | null
  startLongitude: number | null
  hasGeometry: boolean
}

export function TrailAccessActions({
  citySlug,
  trailSlug,
  startLabel,
  startLatitude,
  startLongitude,
  hasGeometry,
}: Props) {
  const [accessState, setAccessState] = useState<AccessState>({ status: 'idle' })
  const hasStart = Number.isFinite(startLatitude) && Number.isFinite(startLongitude)
  const startName = startLabel ?? 'Point de départ'

  function handleJoinStart() {
    if (!hasStart || startLatitude === null || startLongitude === null) return
    if (!('geolocation' in navigator)) {
      setAccessState({ status: 'gps_denied' })
      return
    }

    setAccessState({ status: 'gps_prompt' })
    navigator.geolocation.getCurrentPosition(
      position => {
        setAccessState({
          status: 'route_ready',
          origin: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        })
      },
      () => {
        setAccessState({ status: 'gps_denied' })
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    )
  }

  return (
    <div className="space-y-3">
      {hasGeometry && (
        <Link
          href={`/guide/${citySlug}/rando/${trailSlug}/start`}
          className="flex w-full items-center justify-between rounded-full bg-[#455E4C] px-6 py-4 text-white shadow-sm active:scale-[0.98] transition-transform"
        >
          <span className="flex items-center gap-3 text-[13px] font-bold uppercase tracking-[0.1em]">
            <PlayCircle className="h-5 w-5" />
            Commencer la rando
          </span>
          <ChevronRight className="h-5 w-5 text-white/55" />
        </Link>
      )}

      {hasStart && (
        <button
          type="button"
          onClick={handleJoinStart}
          className="flex w-full items-center justify-between rounded-full border border-white/80 bg-white/70 px-6 py-4 text-[#121212] shadow-sm active:scale-[0.98] transition-transform"
        >
          <span className="flex items-center gap-3 text-[12px] font-bold uppercase tracking-[0.1em]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#455E4C] text-white">
              <Navigation className="h-3 w-3" />
            </span>
            Rejoindre le départ
          </span>
          <span className="rounded-md border border-gray-100 bg-white px-2.5 py-1 text-[10px] font-bold text-[#121212] shadow-sm">
            GPS
          </span>
        </button>
      )}

      {accessState.status === 'gps_prompt' && (
        <p className="rounded-2xl bg-white px-4 py-3 text-xs text-charcoal/60">Demande d'accès GPS en cours...</p>
      )}

      {accessState.status === 'route_ready' && startLatitude !== null && startLongitude !== null && (
        <div data-testid="trail-access-route" className="rounded-[1.5rem] border border-[#455E4C]/15 bg-white p-4 text-sm text-charcoal/70">
          <div className="flex items-start gap-3">
            <LocateFixed className="mt-0.5 h-5 w-5 shrink-0 text-[#455E4C]" />
            <div>
              <p className="font-semibold text-charcoal">Route Mapbox vers le départ prête</p>
              <p className="mt-1 text-xs">
                De {accessState.origin.latitude.toFixed(5)}, {accessState.origin.longitude.toFixed(5)} vers{' '}
                {startLatitude.toFixed(5)}, {startLongitude.toFixed(5)}.
              </p>
            </div>
          </div>
        </div>
      )}

      {accessState.status === 'gps_denied' && startLatitude !== null && startLongitude !== null && (
        <div data-testid="trail-access-start-marker" className="rounded-[1.5rem] border border-[#A68E69]/20 bg-white p-4 text-sm text-charcoal/70">
          <p className="font-semibold text-charcoal">{startName}</p>
          <p className="mt-1 text-xs">
            GPS indisponible. Point de départ : {startLatitude.toFixed(5)}, {startLongitude.toFixed(5)}
          </p>
        </div>
      )}
    </div>
  )
}
