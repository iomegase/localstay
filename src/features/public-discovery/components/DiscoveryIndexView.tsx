import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
} from '@/features/marketing/components/MarketingShell'
import type { DiscoveryIndexCity } from '../types'
import { DiscoveryPoiCard } from './DiscoveryPoiCard'

export function DiscoveryIndexView({ cities }: { cities: DiscoveryIndexCity[] }) {
  return (
    <MarketingShell>
      <div className="overflow-hidden text-slate-800">
        <header className={`${marketingContainerClass} pb-14 pt-12 sm:pb-16 sm:pt-16 lg:pb-20`}>
          <MarketingEyebrow>Le guide local MyStay</MarketingEyebrow>
          <h1 className="max-w-4xl text-[44px] font-semibold leading-[0.96] tracking-[-0.055em] text-slate-900 sm:text-6xl lg:text-7xl">
            Découvrir les bonnes adresses locales.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
            MyStay réunit ici des adresses locales sélectionnées et actuellement publiées.
          </p>
        </header>

        {cities.length === 0 ? (
          <section className="bg-[#f7f6f4] py-14 sm:py-16" aria-label="Sélection locale">
            <div className={marketingContainerClass}>
              <p className="text-lg leading-8 text-slate-600">De nouvelles adresses arrivent bientôt.</p>
            </div>
          </section>
        ) : cities.map((city, index) => (
          <section
            key={city.slug}
            data-city-slug={city.slug}
            className={index % 2 === 0 ? 'bg-[#f7f6f4] py-14 sm:py-16 lg:py-20' : 'py-14 sm:py-16 lg:py-20'}
            aria-labelledby={`discovery-city-${city.slug}`}
          >
            <div className={marketingContainerClass}>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <MarketingEyebrow>La sélection MyStay</MarketingEyebrow>
                  <h2 id={`discovery-city-${city.slug}`} className="text-3xl font-semibold tracking-[-0.045em] text-slate-900 sm:text-4xl">
                    {city.name}
                  </h2>
                </div>
                <Link
                  href={`/decouvrir/${city.slug}`}
                  className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-full bg-slate-800 px-5 text-xs font-bold text-white transition-colors hover:bg-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 sm:self-auto"
                >
                  Découvrir {city.name}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {city.pois.map(poi => (
                  <DiscoveryPoiCard citySlug={city.slug} key={`${poi.category.slug}-${poi.slug}`} poi={poi} />
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </MarketingShell>
  )
}
