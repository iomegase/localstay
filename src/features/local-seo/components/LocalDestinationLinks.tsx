import Link from 'next/link'
import type { LocalSeoIntent } from '../types/landing-pages'
import { localSeoPath } from '../lib/paths'
import { MarketingEyebrow, marketingContainerClass } from '@/features/marketing/components/MarketingShell'

const labels: Record<LocalSeoIntent, string> = {
  concierge: 'Conciergerie',
  seminar: 'Séminaire',
  'vacation-rental': 'Locations',
}

export function LocalDestinationLinks({
  intent,
  destinations,
}: {
  intent: LocalSeoIntent
  destinations: { name: string; slug: string }[]
}) {
  if (destinations.length === 0) return null

  return (
    <section className={`${marketingContainerClass} py-16 sm:py-20`} data-testid={`local-links-${intent}`}>
      <MarketingEyebrow>Par destination</MarketingEyebrow>
      <h2 className="max-w-[620px] text-[30px] font-bold leading-[1.1] tracking-[-0.045em] text-slate-900 sm:text-[38px]">
        Retrouvez MyStay dans votre commune.
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {destinations.map(destination => (
          <Link
            key={destination.slug}
            href={localSeoPath(intent, destination.slug)}
            className="group flex min-h-16 items-center justify-between rounded-[20px] border border-slate-200 bg-white px-5 py-4 text-[13px] font-bold text-slate-800 transition-colors hover:border-pink-200 hover:bg-pink-50 hover:text-pink-600"
          >
            {labels[intent]} à {destination.name}
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
