'use client'

import { useState } from 'react'
import { MarkdownText } from '@/shared/components/MarkdownText'
import { countWords } from '@/shared/lib/description-length'

/** Spec 028 AC-02-19 : au-delà de ce nombre de mots, la description est repliée. */
export const DESCRIPTION_COLLAPSE_WORDS = 150

const textClass =
  'break-words text-[13px] leading-[1.85] text-slate-500 [&_p]:mb-5 [&_p]:text-[13px] [&_p]:leading-[1.85] ' +
  // Intertitres de la description plus lisibles (AC-02-19).
  '[&_h3]:mb-3 [&_h3]:mt-9 [&_h3]:text-[14px] [&_h3]:font-semibold [&_h3]:tracking-[0.02em] [&_h3]:text-slate-800 ' +
  '[&_h4]:mb-3 [&_h4]:mt-8 [&_h4]:text-[14px] [&_h4]:font-semibold [&_h4]:text-slate-800'

/**
 * Description longue de la fiche logement : repliée avec un fondu et « Lire la suite »
 * au-delà de 150 mots. Le texte complet reste dans le HTML (SEO, lecteurs d'écran).
 */
export function LodgingDescription({ source }: { source: string }) {
  const [expanded, setExpanded] = useState(false)
  const collapsible = countWords(source) > DESCRIPTION_COLLAPSE_WORDS
  const collapsed = collapsible && !expanded

  return (
    <div className="mt-7">
      <div
        id="lodging-description"
        data-testid="lodging-description"
        className={collapsed ? 'relative max-h-[22rem] overflow-hidden' : 'relative'}
      >
        <MarkdownText headingLevel={3} source={source} breaks className={textClass} />
        {collapsed && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>
      {collapsible && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="lodging-description"
          onClick={() => setExpanded(value => !value)}
          className="mt-4 inline-flex min-h-10 items-center rounded-full border border-slate-300 px-5 text-xs font-bold text-slate-800 transition-colors hover:border-pink-600 hover:text-pink-600"
        >
          {expanded ? 'Réduire' : 'Lire la suite'}
        </button>
      )}
    </div>
  )
}
