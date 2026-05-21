import prisma from '@/shared/lib/prisma'
import type { CategoryWithCount, CategoryDetail, PoiSummary } from '../types'

export async function getCategoriesForCity(citySlug: string): Promise<CategoryWithCount[] | null> {
  const city = await prisma.city.findFirst({
    where: { slug: citySlug, is_active: true, deleted_at: null },
    select: { id: true },
  })
  if (!city) return null

  const categories = await prisma.category.findMany({
    where: { is_active: true, deleted_at: null },
    orderBy: { sort_order: 'asc' },
    select: {
      id: true, name: true, slug: true, icon: true, sort_order: true,
      _count: {
        select: {
          pois: { where: { city_id: city.id, is_active: true, deleted_at: null } },
        },
      },
    },
  })

  return categories
    .filter(c => c._count.pois > 0)
    .map(c => ({
      id: c.id, name: c.name, slug: c.slug, icon: c.icon,
      sort_order: c.sort_order, poi_count: c._count.pois,
    }))
}

// getCategoryDetail and getPoisForCategory will be added in Task 4
export async function getCategoryDetail(
  _citySlug: string,
  _categorySlug: string,
): Promise<CategoryDetail | null> {
  throw new Error('Not implemented yet — Task 4')
}

export async function getPoisForCategory(
  _citySlug: string,
  _categorySlug: string,
  _subcategorySlug?: string,
): Promise<PoiSummary[]> {
  throw new Error('Not implemented yet — Task 4')
}
