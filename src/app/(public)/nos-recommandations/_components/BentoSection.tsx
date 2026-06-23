import { assignVariants, type RecRow } from './variants'
import { RecommendationCard } from './RecommendationCard'

type Props = {
  title: string
  eyebrow?: string
  rows: RecRow[]
  fallbackCitySlug: string
  showCardCategory?: boolean
}

export function BentoSection({ title, eyebrow, rows, fallbackCitySlug, showCardCategory = true }: Props) {
  if (rows.length === 0) return null
  const cards = assignVariants(rows)

  return (
    <section className="mb-10">
      <div className="mb-4">
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">{eyebrow}</p>
        )}
        <h2 className="mt-1 font-serif text-3xl italic text-charcoal">{title}</h2>
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
