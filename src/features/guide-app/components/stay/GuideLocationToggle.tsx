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
      <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[13px] text-[#697386]">
        <LocateFixed className="h-4 w-4 text-[#DB2777]" aria-hidden="true" />
        Position utilisée
        <button type="button" onClick={onClear} className="min-h-11 font-semibold text-[#DB2777]">
          Ne plus utiliser ma position
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
        className="inline-flex min-h-11 items-center gap-2 text-[13px] font-semibold text-[#DB2777] disabled:opacity-60"
      >
        <LocateFixed className="h-4 w-4" aria-hidden="true" />
        {loading ? 'Localisation…' : 'Utiliser ma position'}
      </button>
      {denied ? <span className="text-[12px] text-[#697386]">Position non disponible.</span> : null}
    </div>
  )
}
