import Link from 'next/link'
import type { CategorySummary } from '@/features/city-guide/types'
import { CategoryIcon } from '@/features/city-guide/lib/category-icon'

export function CategoryGrid({
  categories,
  citySlug,
  lodgingId,
}: {
  categories: CategorySummary[]
  citySlug: string
  lodgingId?: string
}) {
  if (categories.length === 0) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
      {categories.map(cat => (
        <Link
          key={cat.id}
          href={lodgingId ? `/guide/${citySlug}/${cat.slug}?lodging=${lodgingId}` : `/guide/${citySlug}/${cat.slug}`}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white shadow-sm active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-pink-600/10 flex items-center justify-center">
            <CategoryIcon iconSlug={cat.icon} className="w-6 h-6 text-pink-600" />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-pink-600 text-center leading-tight">
            {cat.name}
          </span>
          <span className="text-[9px] font-bold text-white bg-pink-600 rounded-full px-2 py-0.5 leading-none">
            {cat.poi_count > 9 ? '9+' : cat.poi_count}
          </span>
        </Link>
      ))}
    </div>
  )
}
