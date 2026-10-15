import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import {
  breadcrumbCurrentClass,
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
  marketingHeroInsetClass,
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
        <nav aria-label="Fil d’Ariane" className={`${marketingContainerClass} pt-9 text-[11px] font-semibold text-slate-500`}>
          <div className={`${marketingHeroInsetClass} flex flex-wrap items-center gap-2`}>
          <Link className="hover:text-pink-600" href="/">Accueil</Link>
          <ChevronRight aria-hidden="true" className="h-3 w-3" />
          <Link className="hover:text-pink-600" href={`/decouvrir/${citySlug}`}>{category.city.name}</Link>
          <ChevronRight aria-hidden="true" className="h-3 w-3" />
          <span aria-current="page" className={breadcrumbCurrentClass}>{category.name}</span>
          </div>
        </nav>

        <header className={`${marketingContainerClass} pb-10 pt-12 sm:pb-12`}>
          <div data-testid="discovery-category-hero" className={marketingHeroInsetClass}>
            <MarketingEyebrow>Les adresses MyStay</MarketingEyebrow>
            <h1 className="max-w-4xl text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] text-slate-900 sm:text-6xl">
              {/* Spec 065 AC-02-08 : deux lignes, la commune en serif italique 34 px (comme la home). */}
              <span className="block">{category.name} à</span>{' '}
              <span data-testid="category-title-city" className="mt-3 block font-serif text-[34px] font-normal italic leading-[1.1] tracking-[-0.025em]">
                {category.city.name}
              </span>
            </h1>
          </div>
        </header>

        {isSplit ? (
          <nav
            aria-label="Sous-catégories"
            className={`${marketingContainerClass} sticky top-0 z-20 bg-white/95 backdrop-blur-sm`}
          >
            {/* Spec 065 AC-02-07 : menu à la largeur du contenu, pas en pleine page. */}
            <ul className="flex gap-2 overflow-x-auto py-3">
              {category.groups.map(group => {
                const heading = groupHeading(group)
                return (
                  <li key={heading.slug} className="shrink-0">
                    <a
                      href={`#${heading.slug}`}
                      className="group inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-full bg-slate-100 px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-pink-600 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
                    >
                      {heading.name}
                      <span data-testid="subcategory-count" className="text-[10px] font-bold text-pink-600 transition-colors group-hover:text-white">{group.pois.length}</span>
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
