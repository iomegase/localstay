import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getCategoryDetail } from '@/features/categories/queries/categories'
import { getPoiCards } from '@/features/categories/queries/poi-cards'
import { SubCategoryFilter } from '@/features/categories/components/SubCategoryFilter'
import { SortControl } from '@/features/categories/components/SortControl'
import { PoiCard } from '@/features/categories/components/PoiCard'

interface Props {
  params: { 'city-slug': string; 'category-slug': string }
  searchParams: { sub?: string; sort?: string }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const citySlug = params['city-slug']
  const categorySlug = params['category-slug']
  const subcategorySlug = searchParams.sub
  const sort = searchParams.sort === 'rating' ? 'rating' : 'distance'

  const [detail, pois] = await Promise.all([
    getCategoryDetail(citySlug, categorySlug),
    getPoiCards(citySlug, categorySlug, { subcategorySlug, sort }),
  ])

  if (!detail || pois === null) { notFound(); return null }

  return (
    <>
      <div className="px-4 pt-4 pb-2">
        <h1 className="font-serif italic text-2xl text-charcoal">{detail.name}</h1>
        <p className="text-sm text-charcoal/60 mt-0.5">{detail.poi_count} adresses</p>
      </div>

      {detail.subcategories.length > 0 && (
        <Suspense fallback={<div className="h-12" />}>
          <SubCategoryFilter subcategories={detail.subcategories} />
        </Suspense>
      )}

      <Suspense fallback={<div className="h-10" />}>
        <SortControl currentSort={sort} />
      </Suspense>

      <div className="px-4 pt-2 space-y-2">
        {pois.map(poi => (
          <PoiCard key={poi.id} poi={poi} citySlug={citySlug} categorySlug={categorySlug} />
        ))}
        {pois.length === 0 && (
          <p className="text-sm text-charcoal/50 py-8 text-center">Aucun résultat</p>
        )}
      </div>
    </>
  )
}
