'use client'

import Link from 'next/link'
import { ChevronRight, Navigation, PlayCircle } from 'lucide-react'

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
  startLatitude,
  startLongitude,
  hasGeometry,
}: Props) {
  const hasStart = Number.isFinite(startLatitude) && Number.isFinite(startLongitude)
  const joinStartHref = hasStart && startLatitude !== null && startLongitude !== null
    ? buildGoogleMapsStartUrl(startLatitude, startLongitude)
    : null

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

      {joinStartHref && (
        <a
          href={joinStartHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-between rounded-full border border-white/80 bg-white/70 px-6 py-4 text-[#121212] shadow-sm active:scale-[0.98] transition-transform"
        >
          <span className="flex items-center gap-3 text-[12px] font-bold uppercase tracking-[0.1em]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#455E4C] text-white">
              <Navigation className="h-3 w-3" />
            </span>
            Rejoindre le départ
          </span>
          <span className="rounded-md border border-gray-100 bg-white px-2.5 py-1 text-[10px] font-bold text-[#121212] shadow-sm">
            Google Maps
          </span>
        </a>
      )}
    </div>
  )
}

function buildGoogleMapsStartUrl(latitude: number, longitude: number): string {
  const params = new URLSearchParams({
    api: '1',
    destination: `${latitude},${longitude}`,
  })
  return `https://www.google.com/maps/dir/?${params.toString()}`
}
