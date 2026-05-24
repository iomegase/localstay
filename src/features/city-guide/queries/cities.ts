import { prisma } from '@/shared/lib/prisma'
import type { CitySearchResult, CityGuide, CategorySummary } from '../types'
import {
  applyCustomizationToCategorySummaries,
  getPublicCustomization,
} from '@/features/guide-customization/queries/customization'

/**
 * Searches cities by name or postal code.
 * Accent-insensitive via PostgreSQL unaccent extension (BR-06).
 * Prefix match, max 10 results, ordered name-first then postal code.
 */
export async function searchCities(q: string): Promise<CitySearchResult[]> {
  const results = await prisma.$queryRaw<CitySearchResult[]>`
    SELECT id, name, slug, postal_code, department
    FROM "City"
    WHERE deleted_at IS NULL
      AND is_active = true
      AND (
        unaccent(name) ILIKE unaccent(${q + '%'})
        OR postal_code LIKE ${q + '%'}
      )
    ORDER BY
      CASE WHEN unaccent(name) ILIKE unaccent(${q + '%'}) THEN 0 ELSE 1 END,
      name
    LIMIT 10
  `
  return results
}

/**
 * Returns the city guide for a given slug.
 * Categories are filtered to those with at least 1 active POI (BR-01, BR-02).
 * Returns null when the slug does not exist or the city is inactive/deleted.
 */
export async function getCityGuide(
  slug: string,
  options: { lodgingId?: string } = {},
): Promise<CityGuide | null> {
  const city = await prisma.city.findFirst({
    where: { slug, deleted_at: null, is_active: true },
    select: {
      id: true,
      name: true,
      slug: true,
      postal_code: true,
      department: true,
    },
  })

  if (!city) return null

  const categoriesRaw = await prisma.category.findMany({
    where: { deleted_at: null, is_active: true },
    orderBy: { sort_order: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      sort_order: true,
      _count: {
        select: {
          pois: {
            where: {
              city_id: city.id,
              deleted_at: null,
              is_active: true,
            },
          },
        },
      },
    },
  })

  // BR-02: categories with zero active POIs are excluded entirely
  const categories: CategorySummary[] = categoriesRaw
    .filter((c) => c._count.pois >= 1)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      sort_order: c.sort_order,
      poi_count: c._count.pois,
    }))

  const customization = await getPublicCustomization(city.id, options.lodgingId)

  return {
    city,
    categories: customization
      ? applyCustomizationToCategorySummaries(
        categories,
        customization.category_order,
        customization.featured_pois,
      )
      : categories,
    welcome_message: customization?.welcome_message ?? null,
  }
}
