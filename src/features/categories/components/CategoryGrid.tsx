import Link from 'next/link'
import * as LucideIcons from 'lucide-react'
import type { CategorySummary } from '@/features/city-guide/types'
import type { FC } from 'react'

function CategoryIcon({ iconSlug }: { iconSlug: string }) {
  const name = iconSlug
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('') as keyof typeof LucideIcons
  const Icon = (LucideIcons[name] ?? LucideIcons.MapPin) as FC<{ className?: string }>
  return <Icon className="w-6 h-6 text-gold" />
}

export function CategoryGrid({
  categories,
  citySlug,
}: {
  categories: CategorySummary[]
  citySlug: string
}) {
  if (categories.length === 0) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
      {categories.map(cat => (
        <Link
          key={cat.id}
          href={`/guide/${citySlug}/${cat.slug}`}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white shadow-sm active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
            <CategoryIcon iconSlug={cat.icon} />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-gold text-center leading-tight">
            {cat.name}
          </span>
          <span className="text-[9px] font-bold text-white bg-gold rounded-full px-2 py-0.5 leading-none">
            {cat.poi_count > 9 ? '9+' : cat.poi_count}
          </span>
        </Link>
      ))}
    </div>
  )
}
