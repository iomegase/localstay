import { prisma } from '@/shared/lib/prisma'
import type { CategoryWithCount, SubCategoryWithCount, CategoryDetail, PoiSummary } from '../types'

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

  type RawCategory = {
    id: string; name: string; slug: string; icon: string; sort_order: number;
    _count: { pois: number }
  }
  return (categories as RawCategory[])
    .filter(c => c._count.pois > 0)
    .map(c => ({
      id: c.id, name: c.name, slug: c.slug, icon: c.icon,
      sort_order: c.sort_order, poi_count: c._count.pois,
    }))
}

export async function getCategoryDetail(
  citySlug: string,
  categorySlug: string,
): Promise<CategoryDetail | null> {
  const city = await prisma.city.findFirst({
    where: { slug: citySlug, is_active: true, deleted_at: null },
    select: { id: true, latitude: true, longitude: true },
  })
  if (!city) return null

  const category = await prisma.category.findFirst({
    where: { slug: categorySlug, is_active: true, deleted_at: null },
    select: {
      id: true, name: true, slug: true, icon: true, sort_order: true,
      _count: {
        select: {
          pois: { where: { city_id: city.id, is_active: true, deleted_at: null } },
        },
      },
      subcategories: {
        where: { is_active: true, deleted_at: null },
        orderBy: { sort_order: 'asc' },
        select: {
          id: true, name: true, slug: true,
          _count: {
            select: {
              pois: { where: { city_id: city.id, is_active: true, deleted_at: null } },
            },
          },
        },
      },
    },
  })

  if (!category || category._count.pois === 0) return null

  type RawSub = { id: string; name: string; slug: string; _count: { pois: number } }
  const subs: SubCategoryWithCount[] = (category.subcategories as RawSub[])
    .filter(s => s._count.pois > 0)
    .map(s => ({ id: s.id, name: s.name, slug: s.slug, poi_count: s._count.pois }))

  return {
    id: category.id, name: category.name, slug: category.slug,
    icon: category.icon, sort_order: category.sort_order,
    poi_count: category._count.pois,
    subcategories: subs,
    city_id: city.id,
    city_latitude: city.latitude,
    city_longitude: city.longitude,
  }
}

export async function getPoisForCategory(
  citySlug: string,
  categorySlug: string,
  subcategorySlug?: string,
): Promise<PoiSummary[]> {
  const city = await prisma.city.findFirst({
    where: { slug: citySlug, is_active: true, deleted_at: null },
    select: { id: true },
  })
  if (!city) return []

  const category = await prisma.category.findFirst({
    where: { slug: categorySlug, is_active: true, deleted_at: null },
    select: { id: true },
  })
  if (!category) return []

  let subcategoryId: string | undefined
  if (subcategorySlug) {
    const sub = await prisma.subCategory.findFirst({
      where: {
        slug: subcategorySlug,
        category_id: category.id,
        is_active: true,
        deleted_at: null,
      },
      select: { id: true },
    })
    if (!sub) return []
    subcategoryId = sub.id
  }

  const pois = await prisma.pointOfInterest.findMany({
    where: {
      city_id: city.id,
      category_id: category.id,
      ...(subcategoryId ? { subcategory_id: subcategoryId } : {}),
      is_active: true,
      deleted_at: null,
    },
    orderBy: { name: 'asc' },
    select: {
      id: true, name: true, slug: true,
      subcategory: { select: { slug: true } },
    },
  })

  type RawPoi = { id: string; name: string; slug: string; subcategory: { slug: string } | null }
  return (pois as RawPoi[]).map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    subcategory_slug: p.subcategory?.slug ?? null,
  }))
}
