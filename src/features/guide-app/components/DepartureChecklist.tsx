'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

export function DepartureChecklist({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<Set<number>>(() => new Set())

  function toggle(index: number) {
    setChecked(current => {
      const next = new Set(current)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-700">Votre checklist</p>
        <span className="text-xs font-bold text-blue-600">
          {checked.size} / {items.length}
        </span>
      </div>
      <progress
        aria-label="Progression des consignes de départ"
        aria-valuenow={checked.size}
        value={checked.size}
        max={items.length}
        className="mt-3 block h-1.5 w-full overflow-hidden rounded-full accent-blue-600"
      />
      <div className="mt-3 divide-y divide-slate-100">
        {items.map((item, index) => (
          <label
            key={`${item}-${index}`}
            className="flex cursor-pointer items-start gap-3 py-3 text-sm text-slate-600"
          >
            <input
              type="checkbox"
              checked={checked.has(index)}
              onChange={() => toggle(index)}
              className="peer sr-only"
            />
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-slate-300 text-transparent transition-colors peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:text-white">
              <Check className="h-4 w-4" />
            </span>
            <span className="pt-0.5 peer-checked:text-slate-400 peer-checked:line-through">
              {item}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
