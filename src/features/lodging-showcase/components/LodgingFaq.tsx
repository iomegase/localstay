'use client'

import { useState } from 'react'
import { MarkdownText } from '@/shared/components/MarkdownText'

type FaqItem = { id: string; question: string; answer: string }

// PO 2026-10-07 : même rendu que la FAQ de l'accueil (MarketingFaqSection) — cartes, bouton + / ×.
function FaqColumn({ items, openId, onToggle }: { items: FaqItem[]; openId: string | null; onToggle: (id: string) => void }) {
  return (
    <div data-testid="lodging-faq-column" className="flex flex-col gap-3">
      {items.map(item => (
        <details
          key={item.id}
          open={openId === item.id}
          className="group overflow-hidden rounded-[20px] bg-[#f8f7f5] transition-all duration-300 open:bg-white open:shadow-md"
        >
          <summary
            onClick={event => { event.preventDefault(); onToggle(item.id) }}
            className="flex cursor-pointer list-none items-center justify-between gap-6 px-5 py-5 text-[15px] font-bold leading-[1.4] tracking-[-0.025em] text-slate-900 outline-none sm:px-6 sm:py-6 [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <span
              aria-hidden="true"
              data-testid="lodging-faq-toggle"
              className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_4px_14px_rgba(15,23,42,0.05)] transition-all duration-300 group-open:bg-pink-600"
            >
              <span className="relative block size-4 transition-transform duration-300 before:absolute before:left-1/2 before:top-1/2 before:h-[1.5px] before:w-4 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-slate-500 before:content-[''] after:absolute after:left-1/2 after:top-1/2 after:h-4 after:w-[1.5px] after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-slate-500 after:content-[''] group-open:rotate-45 group-open:before:bg-white group-open:after:bg-white" />
            </span>
          </summary>
          {/* Spec 086 AC-02 : réponses en markdown (gras, listes, liens). */}
          <div
            data-testid="lodging-faq-answer"
            className="px-5 pb-6 pr-16 text-[13px] leading-7 text-slate-500 sm:px-6 sm:pb-7 sm:pr-20 [&_li]:text-[13px] [&_li]:text-slate-500 [&_p]:text-left [&_p]:text-[13px] [&_p]:leading-7 [&_p]:text-slate-500 [&_strong]:text-slate-800"
          >
            <MarkdownText source={item.answer} breaks />
          </div>
        </details>
      ))}
    </div>
  )
}

/** Spec 086 AC-01 : FAQ sur 2 colonnes dès md (moitié gauche puis moitié droite). */
export function LodgingFaq({ items }: { items: FaqItem[] }) {
  // PO 2026-10-06 : ouvrir une question ferme la précédente (accordéon exclusif, toutes colonnes).
  const [openId, setOpenId] = useState<string | null>(null)
  if (items.length === 0) return null
  const half = Math.ceil(items.length / 2)
  const columns = items.length > 1 ? [items.slice(0, half), items.slice(half)] : [items]

  return (
    <section>
      <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-pink-600">
        Bon à savoir
      </span>
      <h2 className="mb-7 mt-2 text-[30px] font-semibold leading-[1.08] tracking-[-0.04em] text-slate-800 md:text-[36px]">
        Questions fréquentes.
      </h2>
      <div className="grid gap-3 md:grid-cols-2 md:items-start">
        {columns.map((column, index) => (
          <FaqColumn key={index} items={column} openId={openId} onToggle={id => setOpenId(current => (current === id ? null : id))} />
        ))}
      </div>
    </section>
  )
}
