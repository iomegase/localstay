'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Grid2x2 } from 'lucide-react'
import type { AgendaTypeFacet } from '../types'

export function EventTypeFilter({ facets }: { facets: AgendaTypeFacet[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = searchParams.get('type')

  function select(type: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (type) params.set('type', type)
    else params.delete('type')
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  if (facets.length === 0) return null

  return (
    <section className="mt-4">
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5">
        <button
          onClick={() => select(null)}
          className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 shadow-sm transition ${
            !active ? 'bg-charcoal text-white' : 'border border-gray-100 bg-white text-gray-400'
          }`}
        >
          <span className={`flex h-5 w-5 items-center justify-center rounded-full ${!active ? 'bg-white/15' : 'bg-gray-100'}`}>
            <Grid2x2 className="h-2.5 w-2.5" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Tout</span>
        </button>

        {facets.map((f) => {
          const isActive = active === f.type
          return (
            <button
              key={f.type}
              data-testid={`event-type-${f.type}`}
              onClick={() => select(f.type)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 shadow-sm transition ${
                isActive ? 'bg-charcoal text-white' : 'border border-gray-100 bg-white text-charcoal/70'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/15 text-white' : 'bg-pine/15 text-pine'
                }`}
              >
                {f.count}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest">{f.label}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
