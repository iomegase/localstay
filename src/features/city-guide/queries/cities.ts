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

export interface GuideSearchPoi {
  id: string
  name: string
  slug: string
  category_slug: string
  subcategory_name: string | null
  photo: string | null
}

export interface GuideSearchCategory {
  name: string
  slug: string
}

export interface GuideSearchResults {
  pois: GuideSearchPoi[]
  categories: GuideSearchCategory[]
}

/**
 * Recherche dans le guide d'une ville : POIs (nom OU sous-catégorie) + catégories (nom).
 * Insensible à la casse. Renvoie un résultat vide en dessous de 2 caractères.
 */
export async function searchGuide(citySlug: string, q: string): Promise<GuideSearchResults> {
  const term = q.trim()
  if (term.length < 2) return { pois: [], categories: [] }

  const [pois, categories] = await Promise.all([
    prisma.pointOfInterest.findMany({
      where: {
        is_active: true,
        deleted_at: null,
        city: { slug: citySlug, is_active: true, deleted_at: null },
        category: { is_active: true, deleted_at: null },
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { subcategory: { name: { contains: term, mode: 'insensitive' } } },
        ],
      },
      orderBy: { name: 'asc' },
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        photos: true,
        category: { select: { slug: true } },
        subcategory: { select: { name: true } },
      },
    }),
    prisma.category.findMany({
      where: {
        is_active: true,
        deleted_at: null,
        name: { contains: term, mode: 'insensitive' },
        pois: {
          some: {
            is_active: true,
            deleted_at: null,
            city: { slug: citySlug, is_active: true, deleted_at: null },
          },
        },
      },
      orderBy: { sort_order: 'asc' },
      take: 4,
      select: { name: true, slug: true },
    }),
  ])

  return {
    pois: pois.map(poi => ({
      id: poi.id,
      name: poi.name,
      slug: poi.slug,
      category_slug: poi.category.slug,
      subcategory_name: poi.subcategory?.name ?? null,
      photo: poi.photos[0] ?? null,
    })),
    categories: categories.map(category => ({ name: category.name, slug: category.slug })),
  }
}
