'use client'

import { ChevronDown } from 'lucide-react'
import { MarkdownText } from '@/shared/components/MarkdownText'

type FaqItem = { id: string; question: string; answer: string }

function FaqColumn({ items }: { items: FaqItem[] }) {
  return (
    <div data-testid="lodging-faq-column" className="flex flex-col divide-y divide-slate-200 border-y border-slate-200">
      {items.map(item => (
        <details key={item.id} className="group overflow-hidden bg-white">
          <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-5 py-4 [&::-webkit-details-marker]:hidden">
            <span className="text-[14px] font-semibold text-slate-800">{item.question}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-pink-600 transition-transform duration-300 group-open:rotate-180" />
          </summary>
          {/* Spec 086 AC-02 : réponses en markdown (gras, listes, liens). */}
          <div
            data-testid="lodging-faq-answer"
            className="pb-5 text-[13px] leading-relaxed text-slate-500 [&_li]:text-[13px] [&_li]:text-slate-500 [&_p]:text-left [&_p]:text-[13px] [&_p]:leading-relaxed [&_p]:text-slate-500 [&_strong]:text-slate-800"
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
      <div className="grid md:grid-cols-2 md:items-start md:gap-x-10 [&>div+div]:border-t-0 md:[&>div+div]:border-t">
        {columns.map((column, index) => <FaqColumn key={index} items={column} />)}
      </div>
    </section>
  )
}
