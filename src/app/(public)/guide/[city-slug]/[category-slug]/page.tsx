import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getCategoryDetail, getCategoriesForCity } from '@/features/categories/queries/categories'
import { getPoiCards } from '@/features/categories/queries/poi-cards'
import { CategoryRow } from '@/features/city-guide/components/CategoryRow'
import { SubCategoryFilter } from '@/features/categories/components/SubCategoryFilter'
import { SortControl } from '@/features/categories/components/SortControl'
import { CategoryViewWrapper } from '@/features/categories/components/CategoryViewWrapper'
import { getCategoryColor } from '@/features/categories/lib/category-style'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import type { Metadata } from 'next'
import { categoryMetadata } from '@/features/seo/lib/metadata'
import { getCategoryForSeo } from '@/features/seo/queries/page-data'
import { JsonLd } from '@/shared/components/JsonLd'
import { breadcrumbSchema } from '@/features/seo/lib/structured-data'

interface Props {
  params: Promise<{ 'city-slug': string; 'category-slug': string }>
  searchParams: Promise<{ sub?: string; sort?: string; page?: string; limit?: string; lodging?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'city-slug': citySlug, 'category-slug': categorySlug } = await params
  const seo = await getCategoryForSeo(citySlug, categorySlug)
  if (!seo) return { title: 'Catégorie introuvable', robots: { index: false } }
  return categoryMetadata({
    cityName: seo.cityName,
    categoryName: seo.categoryName,
    citySlug,
    categorySlug,
  })
}

async function triggerGeminiFetchIfNeeded(cityId: string, categoryId: string): Promise<void> {
  if (process.env.LEGACY_PUBLIC_GEMINI_FETCH_ENABLED !== 'true') return

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return
  try {
    await fetch(`${baseUrl}/api/internal/gemini-fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ city_id: cityId, category_id: categoryId }),
    })
  } catch {
    // Silently ignore — AC-03-03: serve existing POIs if fetch fails
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { 'city-slug': citySlug, 'category-slug': categorySlug } = await params
  const resolvedSearch = await searchParams
  const subcategorySlug = resolvedSearch.sub
  const sort = resolvedSearch.sort === 'rating' ? 'rating' : 'distance'
  const page = Math.max(1, Number.parseInt(resolvedSearch.page ?? '1', 10) || 1)
  const limit = Math.min(50, Math.max(1, Number.parseInt(resolvedSearch.limit ?? '20', 10) || 20))
  const lodgingFromCookie = await getActiveLodgingContext()
  const lodgingId = resolvedSearch.lodging ?? lodgingFromCookie?.lodgingId

  const [detail, poiGroups, categories] = await Promise.all([
    getCategoryDetail(citySlug, categorySlug),
    getPoiCards(citySlug, categorySlug, { subcategorySlug, sort, page, limit, lodgingId }),
    getCategoriesForCity(citySlug, { lodgingId }),
  ])

  if (!detail || poiGroups === null) { notFound(); return null }

  // AC-01-01 / AC-03-01: trigger Gemini fetch if cache absent or expired (fire-and-forget)
  void triggerGeminiFetchIfNeeded(detail.city_id, detail.id)

  const categoryColor = getCategoryColor(detail.slug)
  const seo = await getCategoryForSeo(citySlug, categorySlug)

  return (
    <div className="relative">
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Accueil', path: '/' },
          ...(seo ? [{ name: seo.cityName, path: `/guide/${citySlug}` }] : []),
          { name: detail.name, path: `/guide/${citySlug}/${categorySlug}` },
        ])}
      />
      <section className="px-5 pt-4">
        {/* <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
          Points d&apos;intérêt
        </p> */}
        <h1 className="text-4xl uppercase font-light tracking-tight  leading-none text-slate-500">
          {detail.name}
        </h1>
        {/* <p className="mt-4 text-xs leading-6 text-gray-500">
          {poiGroups.meta.total} adresse{poiGroups.meta.total > 1 ? 's' : ''} recommandée{poiGroups.meta.total > 1 ? 's' : ''} .
        </p> */}
      </section>

      <section className="mt-[26px] mb-2">
        <CategoryRow
          categories={categories ?? []}
          citySlug={citySlug}
          lodgingId={lodgingId}
          activeCategorySlug={categorySlug}
        />
      </section>

      {detail.subcategories.length > 0 && (
        <Suspense fallback={<div className="h-12" />}>
          <SubCategoryFilter subcategories={detail.subcategories} />
        </Suspense>
      )}

      {/* Le tri Distance/Note n'a pas de sens pour les randos → masqué sur cette catégorie */}
      {categorySlug !== 'rando' && (
        <Suspense fallback={<div className="h-10" />}>
          <SortControl currentSort={sort} />
        </Suspense>
      )}

      <CategoryViewWrapper
        primary={poiGroups.primary}
        nearby={poiGroups.nearby}
        citySlug={citySlug}
        categorySlug={categorySlug}
        cityCenter={{ latitude: detail.city_latitude, longitude: detail.city_longitude }}
        categoryIcon={detail.icon}
        categoryColor={categoryColor}
        subcategoryCount={detail.subcategories.length}
        subcategorySlug={subcategorySlug}
        sort={sort}
        page={poiGroups.meta.page}
        limit={poiGroups.meta.limit}
        totalPages={poiGroups.meta.total_pages}
        lodgingId={lodgingId}
      />
    </div>
  )
}
