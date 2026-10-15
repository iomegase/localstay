import { featureIconFor } from '@/features/lodging-showcase/lib/feature-icon'

// Spec 086 AC-03 / AC-04 : chaque équipement dans une case, icône dédiée sur pastille (icône slate-800, 028 AC-02-13).
function FeatureItem({ item }: { item: string }) {
  const Icon = featureIconFor(item)

  return (
    <li className="flex min-w-0 items-center gap-2.5 rounded-2xl bg-white px-3 py-3 text-[13px] leading-snug text-slate-700 shadow-md sm:gap-3 sm:px-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-50">
        <Icon aria-hidden="true" className="h-4 w-4 text-slate-800" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 break-words">{item}</span>
    </li>
  )
}

function FeatureCard({
  eyebrow,
  items,
  compact,
  className = '',
  listClassName = 'grid-cols-2 lg:grid-cols-3',
}: {
  eyebrow: string
  items: string[]
  compact: boolean
  className?: string
  listClassName?: string
}) {
  if (items.length === 0) return null

  return (
    <article className={`${className} relative overflow-hidden rounded-[24px] bg-white px-4 pb-6 pt-7 sm:px-6 before:absolute before:left-4 sm:before:left-6 before:top-0 before:h-[3px] before:w-12 before:bg-pink-600`}>
      <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-pink-600">
        {eyebrow}
      </span>
      <ul className={compact ? 'mt-4 grid gap-3' : `mt-4 grid gap-3 ${listClassName}`}>
        {items.map(item => <FeatureItem item={item} key={item} />)}
      </ul>
    </article>
  )
}

/**
 * Équipements puis Services sur demande en cases sur 2 colonnes dès le mobile (086, PO 2026-10-07).
 * Dès lg, une grille de 4 colonnes : 3 pour les équipements, 1 pour les services (028 AC-02-11).
 * Si l'un des blocs est vide, l'autre garde toute la largeur (AC-02-10).
 */
export function LodgingFeatureSections({
  includedAmenities,
  onRequestAmenities,
  compact = false,
}: {
  includedAmenities: string[]
  onRequestAmenities: string[]
  compact?: boolean
}) {
  const split = !compact && includedAmenities.length > 0 && onRequestAmenities.length > 0

  return (
    <section
      data-testid="lodging-feature-sections"
      className={compact
        ? 'mx-auto grid w-full max-w-[944px] gap-4 px-4 py-16'
        : `mx-auto grid w-full max-w-[944px] gap-4 px-4 py-16 sm:px-6 md:py-20 xl:px-0 ${split ? 'lg:grid-cols-4' : ''}`}
    >
      <FeatureCard
        eyebrow="Équipements"
        items={includedAmenities}
        compact={compact}
        className={split ? 'lg:col-span-3' : ''}
      />
      <FeatureCard
        eyebrow="Services sur demande"
        items={onRequestAmenities}
        compact={compact}
        listClassName={split ? 'grid-cols-2 lg:grid-cols-1' : undefined}
      />
    </section>
  )
}
