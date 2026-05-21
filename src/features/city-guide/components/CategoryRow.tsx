import Link from 'next/link'
import * as LucideIcons from 'lucide-react'
import type { CategorySummary } from '../types'

interface CategoryRowProps {
  categories: CategorySummary[]
  citySlug: string
}

function CategoryIcon({ iconSlug }: { iconSlug: string }) {
  // Convert kebab-case slug to PascalCase Lucide component name (e.g. "heart-pulse" → "HeartPulse")
  const componentName = iconSlug
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('') as keyof typeof LucideIcons

  const Icon = (LucideIcons[componentName] ?? LucideIcons.MapPin) as React.FC<{
    className?: string
  }>
  return <Icon className="w-5 h-5" />
}

export function CategoryRow({ categories, citySlug }: CategoryRowProps) {
  // BR-02: return null so categories are absent from the DOM, not just hidden
  if (categories.length === 0) return null

  return (
    <div className="flex gap-5 overflow-x-auto px-6 no-scrollbar pb-2">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/guide/${citySlug}/${cat.slug}`}
          className="group shrink-0 flex flex-col items-center gap-3"
        >
          <div className="relative w-14 h-14 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gold group-hover:shadow-md transition-shadow active:scale-95">
            <CategoryIcon iconSlug={cat.icon} />
            <span className="absolute -top-1 -right-1 bg-gold text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {cat.poi_count > 9 ? '9+' : cat.poi_count}
            </span>
          </div>
          <span className="text-[9px] text-gold font-bold uppercase tracking-widest text-center max-w-[56px] leading-tight">
            {cat.name}
          </span>
        </Link>
      ))}
    </div>
  )
}
