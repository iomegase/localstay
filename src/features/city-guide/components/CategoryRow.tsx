import { Fragment } from 'react'
import Link from 'next/link'
import * as LucideIcons from 'lucide-react'
import type { CategorySummary } from '../types'

interface CategoryRowProps {
  categories: CategorySummary[]
  citySlug: string
  lodgingId?: string
  activeCategorySlug?: string
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

/**
 * Insère une opportunité de césure (<wbr/>) au milieu de chaque mot de plus de
 * 10 lettres, afin qu'un mot long comme « BOULANGERIE » se scinde sur deux
 * lignes dans sa colonne au lieu de déborder. Les mots courts et les libellés
 * multi-mots (« LOCATION DE SKIS ») gardent leur retour à la ligne naturel.
 */
function splitLongWords(name: string): React.ReactNode {
  return name.split(' ').map((word, index, words) => {
    const trailingSpace = index < words.length - 1 ? ' ' : ''
    if (word.length <= 10) {
      return <Fragment key={index}>{word}{trailingSpace}</Fragment>
    }
    const mid = Math.ceil(word.length / 2)
    return (
      <Fragment key={index}>
        {word.slice(0, mid)}
        <wbr />
        {word.slice(mid)}
        {trailingSpace}
      </Fragment>
    )
  })
}

function categoryHref(citySlug: string, categorySlug?: string, lodgingId?: string): string {
  const baseHref = categorySlug
    ? `/guide/${citySlug}/${categorySlug}`
    : `/guide/${citySlug}`
  return lodgingId ? `${baseHref}?lodging=${encodeURIComponent(lodgingId)}` : baseHref
}

export function CategoryRow({ categories, citySlug, lodgingId, activeCategorySlug }: CategoryRowProps) {
  // BR-02: return null so categories are absent from the DOM, not just hidden
  if (categories.length === 0) return null

  return (
    <div className="flex gap-5 overflow-x-auto px-6 no-scrollbar pt-2 pb-2" data-testid="category-row">
      {categories.map((cat) => {
        const isActive = cat.slug === activeCategorySlug
        return (
          <Link
            key={cat.id}
            href={categoryHref(citySlug, cat.slug, lodgingId)}
            aria-current={isActive ? 'page' : undefined}
            className="group shrink-0 flex flex-col items-center gap-3"
          >
            <div
              className={`relative w-14 h-14 rounded-full border flex items-center justify-center group-hover:shadow-md transition-shadow active:scale-95 ${
                isActive
                  ? 'bg-gold border-gold text-white shadow-md'
                  : 'bg-white border-gray-100 text-gold'
              }`}
            >
              <CategoryIcon iconSlug={cat.icon} />
              <span
                className={`absolute -top-1 -right-1 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none ${
                  isActive ? 'bg-white text-gold' : 'bg-gold text-white'
                }`}
              >
                {cat.poi_count > 9 ? '9+' : cat.poi_count}
              </span>
            </div>
            <span className="text-[9px] text-gold font-bold uppercase tracking-widest text-center max-w-[56px] leading-tight">
              {splitLongWords(cat.name)}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
