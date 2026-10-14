'use client'

import { useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { marketingDarkButtonClass } from '@/features/marketing/components/marketing-styles'
import { SeminarActivityCard } from './SeminarActivityCard'
import {
  SEMINAR_ACTIVITY_CATEGORIES,
  SEMINAR_ACTIVITY_CATEGORY_SHORT_LABELS,
  type PublicSeminarActivity,
  type SeminarActivityCategory,
} from '../types'

/** Spec 097 (ajustement PO du 2026-10-14) : 6 cartes, puis bouton « Voir plus ». */
export const SEMINAR_ACTIVITY_INITIAL_COUNT = 6

type Filter = SeminarActivityCategory | 'all'

const pillClass = 'inline-flex min-h-9 shrink-0 items-center rounded-full border px-4 text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600'

export function SeminarActivityGrid({ activities }: { activities: PublicSeminarActivity[] }) {
  const listId = useId()
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState(false)
  const firstRevealed = useRef<HTMLLIElement>(null)

  // Spec 097 (ajustement PO du 2026-10-14) : seules les catégories ayant au moins une carte.
  const categories = SEMINAR_ACTIVITY_CATEGORIES.filter(category => activities.some(activity => activity.category === category))
  const filtered = filter === 'all' ? activities : activities.filter(activity => activity.category === filter)
  const hidden = filtered.length - SEMINAR_ACTIVITY_INITIAL_COUNT
  const visible = expanded ? filtered : filtered.slice(0, SEMINAR_ACTIVITY_INITIAL_COUNT)

  function choose(next: Filter) {
    setFilter(next)
    setExpanded(false)
  }

  function showAll() {
    setExpanded(true)
    // La première carte révélée reçoit le focus : le clavier reprend là où la liste s'arrêtait.
    requestAnimationFrame(() => firstRevealed.current?.focus())
  }

  return (
    <>
      {categories.length > 1 && (
        <div
          role="group"
          aria-label="Filtrer les activités par catégorie"
          className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {(['all', ...categories] as Filter[]).map(value => {
            const active = filter === value
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                aria-controls={listId}
                onClick={() => choose(value)}
                className={`${pillClass} ${active ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-800'}`}
              >
                {value === 'all' ? 'Toutes' : SEMINAR_ACTIVITY_CATEGORY_SHORT_LABELS[value]}
              </button>
            )
          })}
        </div>
      )}
      <ul id={listId} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((activity, index) => (
          <li
            key={activity.id}
            ref={index === SEMINAR_ACTIVITY_INITIAL_COUNT ? firstRevealed : undefined}
            tabIndex={index === SEMINAR_ACTIVITY_INITIAL_COUNT ? -1 : undefined}
            className="min-w-0 rounded-[26px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-600"
          >
            <SeminarActivityCard activity={activity} />
          </li>
        ))}
      </ul>
      {hidden > 0 && !expanded && (
        <div className="mt-8 flex justify-center sm:mt-10">
          <button type="button" aria-controls={listId} aria-expanded={false} onClick={showAll} className={marketingDarkButtonClass}>
            Voir plus d’activités ({hidden})
            <ChevronDown aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      )}
    </>
  )
}
