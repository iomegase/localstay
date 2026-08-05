'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

// Phrase d'intro désormais affichée dans l'en-tête : on l'ignore si elle a été
// saisie comme première ligne des consignes (évite un item en double).
const DEPARTURE_INTRO =
  'afin de faciliter la préparation du logement pour les prochains voyageurs, nous vous remercions de bien vouloir'

function isIntroLine(item: string): boolean {
  return (
    item
      .replace(/\s+/g, ' ')
      .replace(/[\s:]+$/, '')
      .trim()
      .toLowerCase() === DEPARTURE_INTRO
  )
}

export function DepartureChecklist({ items }: { items: string[] }) {
  const tasks = items.filter(item => !isIntroLine(item))
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
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-base font-semibold text-white">Avant votre départ</p>
          <p className="mt-1 text-center text-xs leading-5 text-white/60">
            Afin de faciliter la préparation du logement pour les prochains
            voyageurs, nous vous remercions de bien vouloir&nbsp;:
          </p>
        </div>
        <span className="shrink-0 text-xs font-bold text-pink-400">
          {checked.size} / {tasks.length}
        </span>
      </div>
      <progress
        aria-label="Progression des consignes de départ"
        aria-valuenow={checked.size}
        value={checked.size}
        max={tasks.length}
        className="mt-3 block h-1.5 w-full overflow-hidden rounded-full bg-white/10 accent-pink-600"
      />
      <div className="mt-3">
        {tasks.map((item, index) => (
          <label
            key={`${item}-${index}`}
            className="flex cursor-pointer items-center gap-3 py-3 text-sm text-white/80"
          >
            <input
              type="checkbox"
              checked={checked.has(index)}
              onChange={() => toggle(index)}
              className="peer sr-only"
            />
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-white/30 text-transparent transition-colors peer-checked:border-pink-600 peer-checked:text-pink-600">
              <Check className="h-3.5 w-3.5" />
            </span>
            <span className="peer-checked:text-white/40 peer-checked:line-through">
              {item}
            </span>
          </label>
        ))}
      </div>
      <p className="mt-4 border-t border-white/10 pt-4 text-center text-xs leading-5 text-white/60">
        Merci pour votre séjour et votre attention. Nous vous souhaitons un
        excellent retour&nbsp;!
      </p>
    </div>
  )
}
