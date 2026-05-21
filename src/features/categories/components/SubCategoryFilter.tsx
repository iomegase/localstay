'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
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
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3">
      <button
        onClick={() => select(null)}
        className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
          !active ? 'bg-gold text-white' : 'bg-white text-charcoal border border-gray-200'
        }`}
      >
        Tous
      </button>
      {subcategories.map(sub => (
        <button
          key={sub.id}
          data-testid={`subcategory-${sub.slug}`}
          onClick={() => select(sub.slug)}
          className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
            active === sub.slug ? 'bg-gold text-white' : 'bg-white text-charcoal border border-gray-200'
          }`}
        >
          {sub.name}
          <span className="opacity-70 font-normal normal-case tracking-normal">{sub.poi_count}</span>
        </button>
      ))}
    </div>
  )
}
