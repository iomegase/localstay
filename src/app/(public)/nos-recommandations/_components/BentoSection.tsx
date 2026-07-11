import { assignVariants, type RecRow } from './variants'
import { RecommendationCard } from './RecommendationCard'
import { CategoryIcon } from '@/features/city-guide/lib/category-icon'

type Props = {
  title: string
  eyebrow?: string
  rows: RecRow[]
  fallbackCitySlug: string
  showCardCategory?: boolean
  showTitleCategoryIcon?: boolean
}

export function BentoSection({
  title,
  eyebrow,
  rows,
  fallbackCitySlug,
  showCardCategory = true,
  showTitleCategoryIcon = false,
}: Props) {
  if (rows.length === 0) return null
  const cards = assignVariants(rows)
  const titleCategory = rows[0]?.poi.category ?? null

  return (
    <section className="mb-10">
      <div className="mb-4">
        {/* {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-pink-600">{eyebrow}</p>
        )} */}
        <h2 className="mt-1 inline-flex items-center gap-3 uppercase text-2xl font-light !text-slate-600">
          {showTitleCategoryIcon && titleCategory && (
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-800 shadow-sm ring-1 ring-slate-200"
              aria-hidden="true"
            >
              <CategoryIcon
                iconSlug={titleCategory.icon ?? 'map-pin'}
                categorySlug={titleCategory.slug}
                className="h-6 w-6"
              />
            </span>
          )}
          <span>{title}</span>
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cards.map(({ row, variant }) => (
          <RecommendationCard
            key={row.poi.id}
            row={row}
            variant={variant}
            fallbackCitySlug={fallbackCitySlug}
            showCategory={showCardCategory}
          />
        ))}
      </div>
    </section>
  )
}
