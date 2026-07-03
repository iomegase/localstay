'use client'

import { Trash2 } from 'lucide-react'
import { TRASH_BINS, type TrashBinInput } from '@/features/guide-customization/lib/trash-bins'

interface Props {
  value: TrashBinInput[]
  onChange: (next: TrashBinInput[]) => void
}

/**
 * Éditeur des bacs à poubelles : les 5 presets en interrupteurs. Le libellé et
 * la description affichés au front proviennent du preset — pas de saisie owner.
 */
export function TrashBinsEditor({ value, onChange }: Props) {
  const enabledTypes = new Set(value.map(bin => bin.type))

  function toggle(type: string) {
    if (enabledTypes.has(type)) {
      onChange(value.filter(bin => bin.type !== type))
    } else {
      onChange([...value, { type }])
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-charcoal">Poubelles</h3>
        <p className="text-xs text-gray-500">Activez les bacs présents dans le logement.</p>
      </div>

      <div className="space-y-2">
        {TRASH_BINS.map(bin => {
          const enabled = enabledTypes.has(bin.type)
          return (
            <button
              key={bin.type}
              type="button"
              aria-pressed={enabled}
              onClick={() => toggle(bin.type)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                enabled ? 'border-charcoal bg-[#F4F7FE]' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Trash2 className={`h-6 w-6 shrink-0 ${bin.colorClass}`} />
              <span className="flex-1">
                <span className="block text-sm font-semibold text-charcoal">{bin.label}</span>
                <span className="block text-[11px] text-gray-500">{bin.hint}</span>
              </span>
              <span className={`h-5 w-9 rounded-full p-0.5 transition-colors ${enabled ? 'bg-charcoal' : 'bg-gray-300'}`}>
                <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-4' : ''}`} />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
