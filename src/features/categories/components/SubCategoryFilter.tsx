'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Grid2x2 } from 'lucide-react'
import type { SubCategoryWithCount } from '../types'

export function SubCategoryFilter({ subcategories }: { subcategories: SubCategoryWithCount[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = searchParams.get('sub')

  function select(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (slug) params.set('sub', slug)
    else params.delete('sub')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <section className="mt-4">
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5">
        <button
          onClick={() => select(null)}
          className={`shrink-0 flex items-center gap-2  rounded-full px-3 py-1.5 shadow-sm transition ${
            !active
              ? 'bg-charcoal text-white'
              : 'border border-gray-100 bg-white text-gray-400'
          }`}
        >
          <span
            data-testid="subcategory-all-icon"
            className={`flex h-5 w-5 items-center  justify-center rounded-full ${
              !active ? 'bg-white/15' : 'bg-gray-100'
            }`}
          >
            <Grid2x2 data-testid="subcategory-all-grid" className="h-2.5 w-2.5" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Tous</span>
        </button>

        {subcategories.map(sub => {
          const isActive = active === sub.slug
          return (
            <button
              key={sub.id}
              data-testid={`subcategory-${sub.slug}`}
              onClick={() => select(sub.slug)}
              className={`shrink-0 flex items-center gap-2 rounded-full px-3 py-1.5 shadow-sm transition ${
                isActive
                  ? 'bg-charcoal text-white'
                  : 'border border-gray-100 bg-white text-charcoal/70'
              }`}
            >
              <span
                data-testid={`subcategory-count-${sub.slug}`}
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/15 text-white' : 'bg-pine/15 text-pine'
                }`}
              >
                {sub.poi_count}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest">{sub.name}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
