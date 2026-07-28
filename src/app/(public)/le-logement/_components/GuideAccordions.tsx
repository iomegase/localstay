'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export type GuideAccent = 'pink' | 'orange' | 'green' | 'violet' | 'blue'

export type GuideSection = {
  key: string
  title: string
  subtitle: string
  icon: ReactNode
  accent: GuideAccent
  content: ReactNode
}

export const GUIDE_CARD =
  'rounded-[24px] bg-white shadow-[0_4px_18px_rgba(17,17,17,0.09)]'

const ACCENT_TILE: Record<GuideAccent, string> = {
  pink: 'bg-pink-100 text-pink-600',
  orange: 'bg-orange-100 text-orange-600',
  green: 'bg-lime-100 text-lime-700',
  violet: 'bg-violet-100 text-violet-600',
  blue: 'bg-blue-100 text-blue-700',
}

const ACCENT_TEXT: Record<GuideAccent, string> = {
  pink: 'text-pink-600',
  orange: 'text-orange-600',
  green: 'text-lime-700',
  violet: 'text-violet-600',
  blue: 'text-blue-700',
}

/**
 * Liste d'accordéons du guide logement.
 * - Une seule section ouverte à la fois (state partagé `openKey`).
 * - Déclencheurs = `<button>` natifs → accessibles au clavier (Entrée / Espace)
 *   avec `aria-expanded` / `aria-controls` reliant chaque panneau.
 */
export function GuideAccordions({ sections }: { sections: GuideSection[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null)

  return (
    <div className="grid gap-3">
      {sections.map(section => {
        const isOpen = openKey === section.key
        return (
          <article key={section.key} className={`${GUIDE_CARD} overflow-hidden`}>
            <h3 className="m-0">
              <button
                type="button"
                id={`accordion-trigger-${section.key}`}
                aria-expanded={isOpen}
                aria-controls={`accordion-panel-${section.key}`}
                onClick={() => setOpenKey(current => (current === section.key ? null : section.key))}
                className="grid w-full grid-cols-[48px_minmax(0,1fr)_24px] items-center gap-3 p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
              >
                <span className={`grid h-12 w-12 place-items-center rounded-[15px] ${ACCENT_TILE[section.accent]}`}>
                  {section.icon}
                </span>
                <span className="min-w-0">
                  <strong className="block text-[17px] font-semibold text-slate-900">{section.title}</strong>
                  <small className="mt-1 block text-[13px] leading-snug text-slate-500">{section.subtitle}</small>
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={`h-6 w-6 transition-transform duration-200 ${ACCENT_TEXT[section.accent]} ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </h3>

            <div
              id={`accordion-panel-${section.key}`}
              role="region"
              aria-labelledby={`accordion-trigger-${section.key}`}
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
              <div className="overflow-hidden">
                <div className="grid gap-4 px-4 pb-4 pt-0">{section.content}</div>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
