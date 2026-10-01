import { featureIconFor } from '@/features/lodging-showcase/lib/feature-icon'

function FeatureItem({ item, compact }: { item: string; compact: boolean }) {
  const Icon = featureIconFor(item)

  return (
    <li
      className={`flex items-center gap-3 border-b border-slate-200/70 py-3 text-[12px] leading-snug text-slate-600 last:border-b-0 ${
        // Liste sur 2 colonnes (AC-02-10) : l'avant-dernier élément termine toujours une colonne.
        compact ? '' : 'md:[&:nth-last-child(2)]:border-b-0'
      }`}
    >
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-pink-600" strokeWidth={1.7} />
      <span>{item}</span>
    </li>
  )
}

function FeatureCard({ eyebrow, items, compact }: { eyebrow: string; items: string[]; compact: boolean }) {
  if (items.length === 0) return null

  return (
    <article className="relative overflow-hidden rounded-[24px] bg-[#f8f7f5] px-6 pb-6 pt-7 before:absolute before:left-6 before:top-0 before:h-[3px] before:w-12 before:bg-pink-600">
      <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-pink-600">
        {eyebrow}
      </span>
      <ul className={compact ? 'mt-4' : 'mt-4 md:grid md:grid-cols-2 md:gap-x-10'}>
        {items.map(item => <FeatureItem item={item} key={item} compact={compact} />)}
      </ul>
    </article>
  )
}

/** Équipements puis Services sur demande, chacun sur sa propre ligne pleine largeur (AC-02-10). */
export function LodgingFeatureSections({
  includedAmenities,
  onRequestAmenities,
  compact = false,
}: {
  includedAmenities: string[]
  onRequestAmenities: string[]
  compact?: boolean
}) {
  return (
    <section
      data-testid="lodging-feature-sections"
      className={compact
        ? 'mx-auto grid w-full max-w-[944px] gap-4 px-4 py-16'
        : 'mx-auto grid w-full max-w-[944px] gap-4 px-4 py-16 sm:px-6 md:py-20 xl:px-0'}
    >
      <FeatureCard eyebrow="Équipements" items={includedAmenities} compact={compact} />
      <FeatureCard eyebrow="Services sur demande" items={onRequestAmenities} compact={compact} />
    </section>
  )
}
