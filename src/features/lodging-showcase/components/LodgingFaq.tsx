'use client'

import { ChevronDown } from 'lucide-react'

export function LodgingFaq({ items }: { items: Array<{ id: string; question: string; answer: string }> }) {
  if (items.length === 0) return null

  return (
    <section className="mx-4 mt-6">
      <p className="mb-1 text-[14px] font-bold uppercase tracking-wider text-charcoal">FAQ</p>
      <p className="mb-4 text-[9px] font-light uppercase tracking-widest text-gray-500">Questions fréquentes</p>
      <div className="flex flex-col gap-2">
        {items.map(item => (
          <details key={item.id} className="group overflow-hidden rounded-xl bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5">
              <span className="text-[13px] font-semibold text-charcoal">{item.question}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-gold transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <p className="px-4 pb-4 text-[12px] font-light leading-relaxed text-gray-600">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
