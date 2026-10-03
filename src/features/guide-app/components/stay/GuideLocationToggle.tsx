'use client'

import { LocateFixed } from 'lucide-react'

/** « Utiliser ma position » (spec 057 AC-02-01, règle 003 BR-01a) — position gardée sur l'appareil. */
export function GuideLocationToggle({
  active,
  loading,
  denied,
  onRequest,
  onClear,
}: {
  active: boolean
  loading: boolean
  denied: boolean
  onRequest: () => void
  onClear: () => void
}) {
  if (active) {
    return (
      <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-[#697386]">
        <LocateFixed className="h-4 w-4 text-green-500" aria-hidden="true" />
        GPS activé
        <button type="button" onClick={onClear} className="min-h-11 font-semibold text-red-500/60">
          GPS désactivé
        </button>
      </p>
    )
  }
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3">
      <button
        type="button"
        onClick={onRequest}
        disabled={loading}
        className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-black disabled:opacity-20"
      >
        <LocateFixed className="h-4 w-4" aria-hidden="true" />
        {loading ? 'Localisation…' : 'GPS désactivé'}
      </button>
      {denied ? <span className="text-xs text-[#697386]">Position non disponible.</span> : null}
    </div>
  )
}
