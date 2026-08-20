import Link from 'next/link'
import { ArrowRight, MapPinned } from 'lucide-react'
import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
  marketingDarkButtonClass,
} from '@/features/marketing/components/MarketingShell'
import type { DiscoveryCity } from '../types'
import { DiscoveryPoiCard } from './DiscoveryPoiCard'

function cityIntroduction(city: DiscoveryCity): string {
  const location = [city.department, city.region].filter(Boolean).join(', ')
  return `Une sélection d’adresses validées par MyStay pour découvrir ${city.name}${
    location ? `, ${location}` : ''
  }.`
}

export function DiscoveryCityView({ city }: { city: DiscoveryCity }) {
  const pois = city.categories.flatMap(category => category.pois)

  return (
    <MarketingShell>
      <div className="overflow-hidden text-slate-800">
        <header className={`${marketingContainerClass} pb-14 pt-12 sm:pb-16 sm:pt-16 lg:pb-20`}>
          <MarketingEyebrow>Découvrir</MarketingEyebrow>
          <h1 className="max-w-4xl text-[44px] font-semibold leading-[0.96] tracking-[-0.055em] text-slate-900 sm:text-6xl lg:text-7xl">
            Découvrir {city.name}
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
            {cityIntroduction(city)}
          </p>
        </header>

        <section className="bg-[#f7f6f4] py-14 sm:py-16" aria-labelledby="discovery-categories-title">
          <div className={marketingContainerClass}>
            <MarketingEyebrow>Explorer la ville</MarketingEyebrow>
            <h2 id="discovery-categories-title" className="text-3xl font-semibold tracking-[-0.045em] text-slate-900 sm:text-4xl">
              Choisir une envie.
            </h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {city.categories.map(category => (
                <Link
                  key={category.slug}
                  href={`/decouvrir/${city.slug}/${category.slug}`}
                  className="group flex min-w-0 items-center gap-4 rounded-[20px] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-colors hover:text-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-pink-50 text-pink-600" title={category.icon}>
                    <MapPinned aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-base font-semibold text-slate-900 group-hover:text-pink-600">{category.name}</span>
                    <span className="mt-1 block text-[11px] text-slate-500">
                      {category.poi_count} {category.poi_count > 1 ? 'adresses' : 'adresse'}
                    </span>
                  </span>
                  <ArrowRight aria-hidden="true" className="ml-auto h-4 w-4 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={`${marketingContainerClass} py-16 sm:py-20`} aria-labelledby="discovery-city-pois-title">
          <MarketingEyebrow>La sélection MyStay</MarketingEyebrow>
          <h2 id="discovery-city-pois-title" className="text-3xl font-semibold tracking-[-0.045em] text-slate-900 sm:text-4xl">
            Nos adresses à {city.name}.
          </h2>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pois.map(poi => <DiscoveryPoiCard citySlug={city.slug} key={`${poi.category.slug}-${poi.slug}`} poi={poi} />)}
          </div>
        </section>

        <aside className={`${marketingContainerClass} mb-16 flex flex-col items-start gap-8 rounded-[28px] bg-slate-800 px-7 py-10 text-white sm:px-10 sm:py-12 lg:flex-row lg:items-end lg:justify-between`}>
          <div>
            <MarketingEyebrow light>L’expertise MyStay</MarketingEyebrow>
            <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl">
              Un accueil local qui valorise aussi votre logement.
            </h2>
            <Link className="mt-5 inline-block text-xs font-bold text-slate-300 underline-offset-4 hover:text-white hover:underline" href="/concept">
              Découvrir notre approche
            </Link>
          </div>
          <Link className={`${marketingDarkButtonClass} shrink-0 bg-white text-slate-800 hover:text-white`} href="/confier-mon-logement">
            Confier mon logement
          </Link>
        </aside>
      </div>
    </MarketingShell>
  )
}
