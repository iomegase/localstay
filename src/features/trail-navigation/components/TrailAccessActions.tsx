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
      className="group flex w-full items-center justify-between rounded-none border-2 border-black/80 bg-black/80 px-6 py-4 text-white shadow-sm transition-colors active:scale-[0.98] hover:bg-white hover:text-black"
    >
      <span className="flex items-center gap-3 text-[12px] font-bold uppercase tracking-[0.1em]">
        Commencer la rando
      </span>

      <ChevronRight className="h-5 w-5 text-current" />
    </Link>
  )}

  {joinStartHref && (
    <a
      href={joinStartHref}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex w-full items-center justify-between rounded-none border-2 border-black/80 bg-white px-6 py-4 text-black shadow-sm transition-colors active:scale-[0.98] hover:bg-black hover:text-white"
    >
      <span className="flex items-center gap-3 text-[12px] font-bold uppercase tracking-[0.1em]">
        <span className="flex h-6 w-6 items-center justify-center rounded-full text-current">
          <Navigation className="h-4 w-4 text-current" />
        </span>

        Rejoindre le départ conseillé
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
