'use client'

import { ChevronDown } from 'lucide-react'

export function LodgingFaq({ items }: { items: Array<{ id: string; question: string; answer: string }> }) {
  if (items.length === 0) return null

  return (
    <section>
      <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-pink-600">
        Bon à savoir
      </span>
      <h2 className="mb-7 mt-2 text-[30px] font-semibold leading-[1.08] tracking-[-0.04em] text-slate-800 md:text-[36px]">
        Questions fréquentes.
      </h2>
      <div className="flex flex-col divide-y divide-slate-200 border-y border-slate-200">
        {items.map(item => (
          <details key={item.id} className="group overflow-hidden bg-white">
            <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-5 py-4">
              <span className="text-[14px] font-semibold text-slate-800">{item.question}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-pink-600 transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <p className="max-w-[760px] pb-5 text-[13px] leading-relaxed text-slate-500">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
