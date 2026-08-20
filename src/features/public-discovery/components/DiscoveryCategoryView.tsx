import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
} from '@/features/marketing/components/MarketingShell'
import type { DiscoveryCategory } from '../types'
import { DiscoveryPoiCard } from './DiscoveryPoiCard'

export function DiscoveryCategoryView({ category }: { category: DiscoveryCategory }) {
  const primaryPois = category.pois.filter(poi => poi.zone === 'primary')
  const nearbyPois = category.pois.filter(poi => poi.zone === 'nearby')

  return (
    <MarketingShell>
      <div className="overflow-hidden text-slate-800">
        <nav aria-label="Fil d’Ariane" className={`${marketingContainerClass} flex flex-wrap items-center gap-2 pt-9 text-[11px] font-semibold text-slate-500`}>
          <Link className="hover:text-pink-600" href="/">Accueil</Link>
          <ChevronRight aria-hidden="true" className="h-3 w-3" />
          <Link className="hover:text-pink-600" href={`/decouvrir/${category.city.slug}`}>{category.city.name}</Link>
          <ChevronRight aria-hidden="true" className="h-3 w-3" />
          <span aria-current="page" className="text-slate-800">{category.name}</span>
        </nav>

        <header className={`${marketingContainerClass} pb-14 pt-12 sm:pb-16`}>
          <MarketingEyebrow>Les adresses MyStay</MarketingEyebrow>
          <h1 className="max-w-4xl text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] text-slate-900 sm:text-6xl">
            {category.name} à {category.city.name}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-500">
            Découvrez les adresses {category.name.toLocaleLowerCase('fr-FR')} sélectionnées par MyStay à {category.city.name}.
          </p>
        </header>

        <section className={`${marketingContainerClass} pb-16`} aria-labelledby="primary-pois-title">
          <h2 id="primary-pois-title" className="sr-only">Adresses à proximité</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {primaryPois.map(poi => <DiscoveryPoiCard citySlug={category.city.slug} key={poi.slug} poi={poi} />)}
          </div>
        </section>

        {nearbyPois.length > 0 ? (
          <section className="bg-[#f7f6f4] py-16 sm:py-20" aria-labelledby="nearby-pois-title">
            <div className={marketingContainerClass}>
              <MarketingEyebrow>À quelques kilomètres</MarketingEyebrow>
              <h2 id="nearby-pois-title" className="text-3xl font-semibold tracking-[-0.045em] text-slate-900 sm:text-4xl">
                Aux alentours
              </h2>
              <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {nearbyPois.map(poi => <DiscoveryPoiCard citySlug={category.city.slug} key={poi.slug} poi={poi} />)}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </MarketingShell>
  )
}
