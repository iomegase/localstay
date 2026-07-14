'use client'

import { Flag, Mountain, Route, Timer } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import type { TrailSessionSummary } from '../types'

type Props = {
  summary: TrailSessionSummary
  onViewTrail: () => void
  exitHref?: string
  onExit?: () => void
}

type SummaryMetricProps = {
  icon: ReactNode
  label: string
  value: string
}

function formatDistance(distanceM: number): string {
  if (distanceM < 1000) {
    return `${Math.round(distanceM)} m`
  }

  return `${(distanceM / 1000).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} km`
}

function formatDuration(durationSeconds: number): string {
  const totalMinutes = Math.floor(durationSeconds / 60)

  if (totalMinutes < 60) {
    return `${totalMinutes} min`
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${hours} h ${minutes.toString().padStart(2, '0')} min`
}

function SummaryMetric({ icon, label, value }: SummaryMetricProps) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 rounded-2xl bg-white px-2 py-4 text-center shadow-sm">
      <span className="text-[#315C45]" aria-hidden="true">
        {icon}
      </span>
      <span className="text-xs font-medium text-stone-500">{label}</span>
      <span className="text-base font-semibold text-stone-900">{value}</span>
    </div>
  )
}

export function TrailSessionSummaryModal({
  summary,
  onViewTrail,
  exitHref = '/',
  onExit,
}: Props) {
  const elevationGainM = summary.elevationGainM
  const hasElevation = elevationGainM !== null

  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/45 p-4 backdrop-blur-sm">
      <section
        className="w-full rounded-[2rem] bg-[#FAF9F6] p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trail-summary-title"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#315C45] text-white">
            <Flag className="size-6" aria-hidden="true" />
          </span>
          <h2
            id="trail-summary-title"
            className="font-serif text-2xl font-semibold text-stone-900"
          >
            Randonnée terminée
          </h2>
        </div>

        <div className={`mb-6 grid gap-3 ${hasElevation ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <SummaryMetric
            icon={<Route className="size-5" />}
            label="Distance"
            value={formatDistance(summary.distanceM)}
          />
          <SummaryMetric
            icon={<Timer className="size-5" />}
            label="Durée"
            value={formatDuration(summary.durationSeconds)}
          />
          {hasElevation ? (
            <SummaryMetric
              icon={<Mountain className="size-5" />}
              label="Dénivelé"
              value={`${Math.round(elevationGainM)} m`}
            />
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onViewTrail}
            className="w-full rounded-full bg-[#315C45] px-5 py-3.5 font-semibold text-white transition-colors hover:bg-[#284c39] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315C45] focus-visible:ring-offset-2"
          >
            Voir le tracé
          </button>
          {onExit ? (
            <button
              type="button"
              onClick={onExit}
              className="w-full rounded-full border border-[#315C45] px-5 py-3.5 font-semibold text-[#315C45] transition-colors hover:bg-[#315C45]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315C45] focus-visible:ring-offset-2"
            >
              Quitter la rando
            </button>
          ) : (
            <Link
              href={exitHref}
              className="block w-full rounded-full border border-[#315C45] px-5 py-3.5 text-center font-semibold text-[#315C45] transition-colors hover:bg-[#315C45]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315C45] focus-visible:ring-offset-2"
            >
              Quitter la rando
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
