import * as LucideIcons from 'lucide-react'
import type { FC } from 'react'
import { getPublicCategoryIconSlug } from './public-category-icon'

/**
 * Rend une icône Lucide à partir d'un slug kebab-case (ex. "heart-pulse" → HeartPulse).
 * Retombe sur MapPin si le slug ne correspond à aucune icône.
 */
export function CategoryIcon({
  iconSlug,
  categorySlug,
  className,
}: {
  iconSlug: string
  categorySlug?: string
  className?: string
}) {
  const resolvedIconSlug = getPublicCategoryIconSlug(categorySlug, iconSlug)
  const componentName = resolvedIconSlug
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('') as keyof typeof LucideIcons
  const Icon = (LucideIcons[componentName] ?? LucideIcons.MapPin) as FC<{ className?: string }>
  return <Icon className={className} />
}
