import { featureIconFor } from '@/features/lodging-showcase/lib/feature-icon'

// Spec 086 AC-03 / AC-04 : chaque équipement dans une case, icône dédiée sur pastille.
function FeatureItem({ item }: { item: string }) {
  const Icon = featureIconFor(item)

  return (
    <li className="flex min-w-0 items-center gap-2.5 rounded-2xl bg-white px-3 py-3 text-[13px] leading-snug text-slate-700 shadow-md sm:gap-3 sm:px-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-50">
        <Icon aria-hidden="true" className="h-4 w-4 text-pink-600" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 break-words">{item}</span>
    </li>
  )
}

function FeatureCard({ eyebrow, items, compact }: { eyebrow: string; items: string[]; compact: boolean }) {
  if (items.length === 0) return null

  return (
    <article className="relative overflow-hidden rounded-[24px] bg-white px-4 pb-6 pt-7 sm:px-6 before:absolute before:left-4 sm:before:left-6 before:top-0 before:h-[3px] before:w-12 before:bg-pink-600">
      <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-pink-600">
        {eyebrow}
      </span>
      <ul className={compact ? 'mt-4 grid gap-3' : 'mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3'}>
        {items.map(item => <FeatureItem item={item} key={item} />)}
      </ul>
    </article>
  )
}

/** Équipements puis Services sur demande, chacun sur sa propre ligne pleine largeur (AC-02-10), en cases sur 2 colonnes dès le mobile puis 3 (086, PO 2026-10-07). */
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
