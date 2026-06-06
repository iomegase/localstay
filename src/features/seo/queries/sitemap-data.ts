import { prisma } from '@/shared/lib/prisma'
import type { SitemapCity, SitemapPoi } from '../lib/sitemap'

/** Données publiques indexables pour le sitemap : villes actives + POI actifs (avec slugs ville/catégorie). */
export async function getSitemapData(): Promise<{ cities: SitemapCity[]; pois: SitemapPoi[] }> {
  const [cities, pois] = await Promise.all([
    prisma.city.findMany({
      where: { is_active: true, deleted_at: null },
      select: { slug: true, updated_at: true },
    }),
    prisma.pointOfInterest.findMany({
      where: {
        is_active: true,
        deleted_at: null,
        city: { is_active: true, deleted_at: null },
        category: { is_active: true, deleted_at: null },
      },
      select: {
        slug: true,
        updated_at: true,
        city: { select: { slug: true } },
        category: { select: { slug: true } },
      },
    }),
  ])

  return {
    cities,
    pois: pois.map(poi => ({
      slug: poi.slug,
      city_slug: poi.city.slug,
      category_slug: poi.category.slug,
      updated_at: poi.updated_at,
    })),
  }
}
