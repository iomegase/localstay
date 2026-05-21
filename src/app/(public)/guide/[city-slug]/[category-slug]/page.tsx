import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getCategoryDetail, getPoisForCategory } from '@/features/categories/queries/categories'
import { SubCategoryFilter } from '@/features/categories/components/SubCategoryFilter'

interface Props {
  params: { 'city-slug': string; 'category-slug': string }
  searchParams: { sub?: string }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const citySlug = params['city-slug']
  const categorySlug = params['category-slug']
  const subcategorySlug = searchParams.sub

  const [detail, pois] = await Promise.all([
    getCategoryDetail(citySlug, categorySlug),
    getPoisForCategory(citySlug, categorySlug, subcategorySlug),
  ])

  if (!detail) { notFound(); return null }

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

      <ul className="px-4 pt-2 space-y-2" data-testid="poi-list">
        {pois.map(poi => (
          <li
            key={poi.id}
            className="p-3 bg-white rounded-xl shadow-sm text-sm font-medium text-charcoal"
          >
            {poi.name}
          </li>
        ))}
        {pois.length === 0 && (
          <li className="text-sm text-charcoal/50 py-8 text-center">Aucun résultat</li>
        )}
      </ul>
    </>
  )
}
