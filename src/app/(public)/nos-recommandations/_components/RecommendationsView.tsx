import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { prisma } from '@/shared/lib/prisma'
import type { LodgingModeContext } from '@/features/public-menu/lib/lodging-mode'
import { Hero } from './Hero'
import { BentoSection } from './BentoSection'
import type { RecRow } from './variants'

export async function RecommendationsView({
  lodgingContext,
}: {
  lodgingContext: LodgingModeContext
}) {
  const featuredPois = (await prisma.lodgingFeaturedPoi.findMany({
    where: { lodging_id: lodgingContext.lodgingId, deleted_at: null },
    orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    select: {
      poi_id: true,
      owner_note: true,
      poi: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          photos: true,
          category: { select: { name: true, slug: true } },
          city: { select: { slug: true, name: true } },
        },
      },
    },
  })) as RecRow[]

  // Résolution défensive : un POI sans city rattaché est considéré local.
  const cityOf = (row: RecRow) => row.poi.city?.slug ?? lodgingContext.citySlug

  const localRows = featuredPois.filter(row => cityOf(row) === lodgingContext.citySlug)
  const otherRows = featuredPois.filter(row => cityOf(row) !== lodgingContext.citySlug)
  const grouped = groupByCategory(localRows)
  const otherByCity = groupByCity(otherRows)
  const hasAny = grouped.length > 0 || otherByCity.length > 0

  const stats = {
    places: featuredPois.length,
    categories: new Set(featuredPois.map(r => r.poi.category.slug)).size,
    cities: new Set(featuredPois.map(cityOf)).size,
  }

  return (
    <div className="bg-cream px-4 pt-2">
      {/* <header className="mb-6 flex items-center justify-between pt-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gray-400">MyStay</p>
          <p className="mt-1 text-xs text-gray-500">Mode séjour activé</p>
        </div>
      </header> */}

      <Hero
        ownerName={lodgingContext.ownerName}
        lodgingName={lodgingContext.lodgingName}
        cityName={lodgingContext.cityName}
        citySlug={lodgingContext.citySlug}
        stats={stats}
      />

      {!hasAny ? (
        <EmptyState citySlug={lodgingContext.citySlug} />
      ) : (
        <div className="pb-8">
          {grouped.map((group, i) => (
            <BentoSection
              key={group.categorySlug}
              eyebrow={i === 0 ? 'Sélection principale' : group.categoryName}
              title={group.categoryName}
              rows={group.items}
              fallbackCitySlug={lodgingContext.citySlug}
              showCardCategory={false}
            />
          ))}

          {otherByCity.length > 0 && (
            <div className="mb-2">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
                Un peu plus loin dans la vallée...
              </p>
              {otherByCity.map(group => (
                <BentoSection
                  key={group.citySlug}
                  title={`À ${group.cityName}`}
                  rows={group.items}
                  fallbackCitySlug={lodgingContext.citySlug}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

type Group = { categorySlug: string; categoryName: string; items: RecRow[] }

function groupByCategory(rows: RecRow[]): Group[] {
  const map = new Map<string, Group>()
  for (const row of rows) {
    const slug = row.poi.category.slug
    const existing = map.get(slug)
    if (existing) {
      existing.items.push(row)
    } else {
      map.set(slug, { categorySlug: slug, categoryName: row.poi.category.name, items: [row] })
    }
  }
  return [...map.values()]
}

type CityGroup = { citySlug: string; cityName: string; items: RecRow[] }

function groupByCity(rows: RecRow[]): CityGroup[] {
  const map = new Map<string, CityGroup>()
  for (const row of rows) {
    const slug = row.poi.city?.slug ?? ''
    const name = row.poi.city?.name ?? ''
    const existing = map.get(slug)
    if (existing) {
      existing.items.push(row)
    } else {
      map.set(slug, { citySlug: slug, cityName: name, items: [row] })
    }
  }
  return [...map.values()]
}

function EmptyState({ citySlug }: { citySlug: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
      <Sparkles className="mx-auto h-8 w-8 text-gray-300" />
      <p className="mt-3 text-sm text-gray-500">
        Votre hôte n&apos;a pas encore sélectionné de lieux à vous recommander.
      </p>
      <Link
        href={`/guide/${citySlug}`}
        className="mt-5 inline-flex items-center justify-center rounded-full bg-charcoal px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-white"
      >
        Voir le guide complet
      </Link>
    </div>
  )
}
