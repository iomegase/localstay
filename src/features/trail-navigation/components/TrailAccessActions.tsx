'use client'

import Link from 'next/link'
import { Map, Play } from 'lucide-react'

interface Props {
  citySlug: string
  categorySlug: string
  trailSlug: string
  startLabel: string | null
  startLatitude: number | null
  startLongitude: number | null
  hasGeometry: boolean
}

export function TrailAccessActions({
  citySlug,
  categorySlug,
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
    <div className="mx-auto w-full max-w-sm space-y-3 px-1">
      {hasGeometry && (
        <Link
          href={`/guide/${citySlug}/${categorySlug}/${trailSlug}/start`}
          aria-label="Commencer la rando"
          className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#4A5D53] px-5 py-4 text-white shadow-sm transition-all duration-300 hover:bg-[#3D4D44] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A5D53] focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          <Play
            aria-hidden="true"
            className="h-5 w-5 fill-current transition-transform duration-300 group-hover:scale-110"
          />

          <span className="text-[15px] font-bold tracking-wide">Commencer</span>

          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-0 h-20 w-28 text-white opacity-[0.08]"
          >
            <svg
              viewBox="0 0 140 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-full w-full"
            >
              <path d="M15 100L62 31L83 59L100 38L140 100H15Z" fill="currentColor" />
              <path d="M70 100V61L58 78H66L51 96H63L47 100H70Z" fill="currentColor" />
              <path d="M108 100V52L97 70H104L90 91H101L84 100H108Z" fill="currentColor" />
              <path d="M130 100V67L122 79H127L117 93H124L112 100H130Z" fill="currentColor" />
            </svg>
          </span>
        </Link>
      )}

      {joinStartHref && (
        <a
          href={joinStartHref}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-[#4A5D53]/20 bg-transparent px-5 py-3.5 text-[#4A5D53] transition-all duration-300 hover:border-[#4A5D53]/35 hover:bg-[#4A5D53]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A5D53] focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          <Map
            aria-hidden="true"
            className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5"
          />

          <span className="text-[15px] font-semibold">Rejoindre le départ</span>
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
