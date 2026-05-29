import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getCategoryDetail } from '@/features/categories/queries/categories'
import { getPoiCards } from '@/features/categories/queries/poi-cards'
import { SubCategoryFilter } from '@/features/categories/components/SubCategoryFilter'
import { SortControl } from '@/features/categories/components/SortControl'
import { CategoryViewWrapper } from '@/features/categories/components/CategoryViewWrapper'

interface Props {
  params: Promise<{ 'city-slug': string; 'category-slug': string }>
  searchParams: Promise<{ sub?: string; sort?: string; page?: string; limit?: string; lodging?: string }>
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
  const lodgingId = resolvedSearch.lodging

  const [detail, poiGroups] = await Promise.all([
    getCategoryDetail(citySlug, categorySlug),
    getPoiCards(citySlug, categorySlug, { subcategorySlug, sort, page, limit, lodgingId }),
  ])

  if (!detail || poiGroups === null) { notFound(); return null }

  // AC-01-01 / AC-03-01: trigger Gemini fetch if cache absent or expired (fire-and-forget)
  void triggerGeminiFetchIfNeeded(detail.city_id, detail.id)

  return (
    <>
      <div className="px-4 pt-4 pb-2">
        <h1 className="font-serif italic text-2xl text-charcoal">{detail.name}</h1>
        <p className="text-sm text-charcoal/60 mt-0.5">
          {poiGroups.meta.total} adresses
        </p>
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

        primary={poiGroups.primary}
        nearby={poiGroups.nearby}
        citySlug={citySlug}
        categorySlug={categorySlug}
        cityCenter={{ latitude: detail.city_latitude, longitude: detail.city_longitude }}
        subcategorySlug={subcategorySlug}
        sort={sort}
        page={poiGroups.meta.page}
        limit={poiGroups.meta.limit}
        totalPages={poiGroups.meta.total_pages}
        lodgingId={lodgingId}
      />
    </>
  )
}
