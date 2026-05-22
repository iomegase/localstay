import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getCategoryDetail } from '@/features/categories/queries/categories'
import { getPoiCards } from '@/features/categories/queries/poi-cards'
import { SubCategoryFilter } from '@/features/categories/components/SubCategoryFilter'
import { SortControl } from '@/features/categories/components/SortControl'
import { CategoryViewWrapper } from '@/features/categories/components/CategoryViewWrapper'

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

      <CategoryViewWrapper
        pois={pois}
        citySlug={citySlug}
        categorySlug={categorySlug}
        cityCenter={{ latitude: detail.city_latitude, longitude: detail.city_longitude }}
      />
    </>
  )
}
