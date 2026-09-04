import { featureIconFor } from '@/features/lodging-showcase/lib/feature-icon'

function FeatureItem({ item }: { item: string }) {
  const Icon = featureIconFor(item)

  return (
    <li className="flex items-center gap-3 border-b border-slate-200/70 py-3 text-[12px] leading-snug text-slate-600 last:border-b-0">
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-pink-600" strokeWidth={1.7} />
      <span>{item}</span>
    </li>
  )
}

function FeatureCard({ eyebrow, items, compact }: { eyebrow: string; items: string[]; compact: boolean }) {
  if (items.length === 0) return null

  return (
    <article className={`relative overflow-hidden rounded-[24px] bg-[#f8f7f5] px-6 pb-6 pt-7 before:absolute before:left-6 before:top-0 before:h-[3px] before:w-12 before:bg-pink-600 ${compact ? '' : 'md:min-h-[320px]'}`}>
      <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-pink-600">
        {eyebrow}
      </span>
      <ul className="mt-4">{items.map(item => <FeatureItem item={item} key={item} />)}</ul>
    </article>
  )
}

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
        : 'mx-auto grid w-full max-w-[944px] gap-4 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-20 xl:px-0'}
    >
      <FeatureCard eyebrow="Équipements" items={includedAmenities} compact={compact} />
      <FeatureCard eyebrow="Services sur demande" items={onRequestAmenities} compact={compact} />
    </section>
  )
}
