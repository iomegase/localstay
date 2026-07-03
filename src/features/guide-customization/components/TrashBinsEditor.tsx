'use client'

import { Trash2 } from 'lucide-react'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { TRASH_BINS, type TrashBinInput } from '@/features/guide-customization/lib/trash-bins'

interface Props {
  value: TrashBinInput[]
  onChange: (next: TrashBinInput[]) => void
}

/**
 * Éditeur des bacs à poubelles : les 5 presets en interrupteurs ; activer un bac
 * ouvre son champ description. L'ordre suit celui du preset.
 */
export function TrashBinsEditor({ value, onChange }: Props) {
  const byType = new Map(value.map(bin => [bin.type, bin]))

  function toggle(type: string) {
    if (byType.has(type)) {
      onChange(value.filter(bin => bin.type !== type))
    } else {
      onChange([...value, { type, description: '' }])
    }
  }

  function setDescription(type: string, description: string) {
    onChange(value.map(bin => (bin.type === type ? { ...bin, description } : bin)))
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-charcoal">Poubelles</h3>
        <p className="text-xs text-gray-500">Activez les bacs présents et décrivez ce qui va dedans.</p>
      </div>

      <div className="space-y-3">
        {TRASH_BINS.map(bin => {
          const current = byType.get(bin.type)
          const enabled = current !== undefined
          return (
            <div key={bin.type} className="rounded-2xl border border-gray-200 p-3">
              <button
                type="button"
                aria-pressed={enabled}
                onClick={() => toggle(bin.type)}
                className={`flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors ${
                  enabled ? 'bg-[#F4F7FE]' : 'hover:bg-gray-50'
                }`}
              >
                <Trash2 className={`h-6 w-6 shrink-0 ${bin.colorClass}`} />
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-charcoal">{bin.label}</span>
                  <span className="block text-[11px] text-gray-500">{bin.hint}</span>
                </span>
                <span
                  className={`h-5 w-9 rounded-full p-0.5 transition-colors ${enabled ? 'bg-charcoal' : 'bg-gray-300'}`}
                >
                  <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-4' : ''}`} />
                </span>
              </button>

              {enabled && (
                <div className="mt-3">
                  <Label htmlFor={`trash-${bin.type}`} className="sr-only">
                    Description {bin.label}
                  </Label>
                  <Textarea
                    id={`trash-${bin.type}`}
                    rows={2}
                    maxLength={500}
                    value={current?.description ?? ''}
                    placeholder={`Ex. ${bin.hint}`}
                    onChange={event => setDescription(bin.type, event.target.value)}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
