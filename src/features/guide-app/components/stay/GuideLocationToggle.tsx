'use client'

import { useId } from 'react'
import { LocateFixed } from 'lucide-react'
import { Switch } from '@/shared/components/ui/switch'

/**
 * Interrupteur GPS sous la recherche (spec 057 AC-02-01, amendement PO
 * 2026-10-04 : même contrôle que « Réglages et infos ») — position gardée sur l'appareil.
 */
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
  const switchId = useId()
  const descriptionId = `${switchId}-description`

  return (
    <div className="mt-2 flex min-h-11 items-center gap-2">
      <LocateFixed className="h-4 w-4 shrink-0 text-slate-800" strokeWidth={1} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <label htmlFor={switchId} className="block text-xs font-semibold text-slate-900">
          {loading ? 'Localisation…' : 'GPS'}
        </label>
        {denied ? (
          <p id={descriptionId} className="text-xs text-[#697386]" aria-live="polite">Position non disponible.</p>
        ) : null}
      </div>
      <Switch
        id={switchId}
        aria-describedby={denied ? descriptionId : undefined}
        checked={active}
        disabled={loading}
        onCheckedChange={enabled => (enabled ? onRequest() : onClear())}
        className="data-[state=checked]:bg-slate-900 data-[state=unchecked]:bg-slate-200"
      />
    </div>
  )
}
