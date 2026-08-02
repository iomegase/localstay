'use client'

import { ChevronUp } from 'lucide-react'

type Props = {
  statusColor: string
  healthColor: string
  healthLabel: string
  statusLabel: string
  distanceKm: number | null
  entryProgressPercent: number | null
  elapsedSeconds: number | null
  pulse: boolean
  onExpand: () => void
}

export function NavigationHud({
  statusColor,
  healthColor,
  healthLabel,
  statusLabel,
  distanceKm,
  entryProgressPercent,
  elapsedSeconds,
  pulse,
  onExpand,
}: Props) {
  return (
    <div
      data-testid="trail-navigation-hud"
      className={`absolute inset-x-3 bottom-3 rounded-[26px] bg-[#FAF9F6]/95 px-5 py-3.5 shadow-[0_10px_36px_-10px_rgba(18,18,18,0.32)] backdrop-blur ${pulse ? 'animate-pulse' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-charcoal/80 whitespace-nowrap">{statusLabel}</span>
          <span
            data-testid="gps-health-dot"
            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: healthColor }}
            aria-label={healthLabel}
            title={healthLabel}
          />
          <span className="text-[10px] font-medium text-charcoal/65 whitespace-nowrap">{healthLabel}</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium text-charcoal">
          {distanceKm !== null && (
            <span><strong>{distanceKm.toFixed(1)}</strong> km</span>
          )}
          {entryProgressPercent !== null && (
            <span className="text-charcoal/60">·</span>
          )}
          {entryProgressPercent !== null && (
            <span><strong>{Math.round(entryProgressPercent)}</strong>%</span>
          )}
          {elapsedSeconds !== null && (
            <span className="text-charcoal/60">·</span>
          )}
          {elapsedSeconds !== null && (
            <span className="font-mono text-charcoal/80">{formatElapsed(elapsedSeconds)}</span>
          )}
        </div>
        <button
          type="button"
          onClick={onExpand}
          aria-label="Afficher les détails"
          className="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 shadow-sm active:scale-95 transition-transform"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>
      {entryProgressPercent !== null && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-charcoal/10">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(100, Math.max(0, entryProgressPercent))}%`,
              backgroundColor: statusColor,
            }}
          />
        </div>
      )}
    </div>
  )
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)} s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `${hours}h${String(minutes % 60).padStart(2, '0')}`
}
