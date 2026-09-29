'use client'

import { useState } from 'react'
import { Check, ListChecks } from 'lucide-react'
import { GuideCardHeading } from './GuideCard'

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

      <GuideCardHeading
        icon={ListChecks}
        tone="checklist"
        title="Avant votre départ"
        trailing={
          <span aria-live="polite" className="text-sm font-bold">
            {checked.size} / {tasks.length}
          </span>
        }
      />
      <p className="mt-3 text-[13px] leading-5 text-white/80">
        Afin de faciliter la préparation du logement pour les prochains
        voyageurs, nous vous remercions de bien vouloir&nbsp;:
      </p>
      <progress
        aria-label="Progression des consignes de départ"
        aria-valuenow={checked.size}
        value={checked.size}
        max={tasks.length}
        className="mt-3 block h-1.5 w-full overflow-hidden rounded-full bg-white/10 accent-[#5b7fc4]"
      />
      <div className="mt-2 divide-y divide-white/10">
        {tasks.map((item, index) => (
          <label
            key={`${item}-${index}`}
            className="flex cursor-pointer items-center gap-3 py-3 text-[13px] leading-5 text-white/85"
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
            <span className="peer-checked:text-white/60 peer-checked:line-through">
              {item}
            </span>
          </label>
        ))}
      </div>
      <p className="mt-2 border-t border-white/10 pt-4 text-center text-[13px] leading-5 text-white/80">
        Merci pour votre séjour et votre attention. Nous vous souhaitons un
        excellent retour&nbsp;!
      </p>
    </div>
  )
}
