import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
} from '@/features/marketing/components/MarketingShell'
import type { DiscoveryCategory, DiscoveryPoiGroup } from '../types'
import { DiscoveryPoiCard } from './DiscoveryPoiCard'

// Spec 065 AC-02-03 : POI sans sous-catégorie.
const OTHER_ADDRESSES = { name: 'Autres adresses', slug: 'autres-adresses' }

function groupHeading(group: DiscoveryPoiGroup) {
  return group.subcategory ?? OTHER_ADDRESSES
}

export function DiscoveryCategoryView({ category }: { category: DiscoveryCategory }) {
  const citySlug = category.city.slug
  // Spec 065 AC-02-04 : un seul groupe → liste simple, sans pastilles ni titres.
  const isSplit = category.groups.length > 1

  return (
    // Pas d'overflow-hidden ici : il désactiverait la barre de pastilles collante.
    <MarketingShell>
      <div className="overflow-x-clip text-slate-800">
        <nav aria-label="Fil d’Ariane" className={`${marketingContainerClass} flex flex-wrap items-center gap-2 pt-9 text-[11px] font-semibold text-slate-500`}>
          <Link className="hover:text-pink-600" href="/">Accueil</Link>
          <ChevronRight aria-hidden="true" className="h-3 w-3" />
          <Link className="hover:text-pink-600" href={`/decouvrir/${citySlug}`}>{category.city.name}</Link>
          <ChevronRight aria-hidden="true" className="h-3 w-3" />
          <span aria-current="page" className="text-slate-800">{category.name}</span>
        </nav>

        <header className={`${marketingContainerClass} pb-10 pt-12 sm:pb-12`}>
          <MarketingEyebrow>Les adresses MyStay</MarketingEyebrow>
          <h1 className="max-w-4xl text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] text-slate-900 sm:text-6xl">
            {category.name} à {category.city.name}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-500">
            Découvrez les adresses {category.name.toLocaleLowerCase('fr-FR')} sélectionnées par MyStay à {category.city.name}.
          </p>
        </header>

        {isSplit ? (
          <nav
            aria-label="Sous-catégories"
            className="sticky top-0 z-20 overflow-x-auto border-y border-slate-100 bg-white/95 py-3 backdrop-blur-sm"
          >
            <ul className={`${marketingContainerClass} flex w-max min-w-full gap-2`}>
              {category.groups.map(group => {
                const heading = groupHeading(group)
                return (
                  <li key={heading.slug}>
                    <a
                      href={`#${heading.slug}`}
                      className="inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-full bg-slate-100 px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-pink-50 hover:text-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
                    >
                      {heading.name}
                      <span className="text-[10px] font-bold text-slate-400">{group.pois.length}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
        ) : null}

        <div className={`${marketingContainerClass} pb-16 ${isSplit ? 'pt-10' : ''}`}>
          {isSplit ? (
            <div className="space-y-14">
              {category.groups.map(group => {
                const heading = groupHeading(group)
                return (
                  <section key={heading.slug} id={heading.slug} aria-labelledby={`${heading.slug}-title`} className="scroll-mt-20">
                    <h2 id={`${heading.slug}-title`} className="text-2xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-3xl">
                      {heading.name}
                    </h2>
                    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {group.pois.map(poi => <DiscoveryPoiCard citySlug={citySlug} key={poi.slug} poi={poi} />)}
                    </div>
                  </section>
                )
              })}
            </div>
          ) : (
            <section aria-label="Adresses à proximité">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {category.groups.flatMap(group => group.pois).map(poi => (
                  <DiscoveryPoiCard citySlug={citySlug} key={poi.slug} poi={poi} />
                ))}
              </div>
            </section>
          )}
        </div>

        {category.nearby_pois.length > 0 ? (
          <section className="bg-[#f7f6f4] py-16 sm:py-20" aria-labelledby="nearby-pois-title">
            <div className={marketingContainerClass}>
              <MarketingEyebrow>À quelques kilomètres</MarketingEyebrow>
              <h2 id="nearby-pois-title" className="text-3xl font-semibold tracking-[-0.045em] text-slate-900 sm:text-4xl">
                Aux alentours
              </h2>
              <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {category.nearby_pois.map(poi => <DiscoveryPoiCard citySlug={citySlug} key={poi.slug} poi={poi} />)}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </MarketingShell>
  )
}
