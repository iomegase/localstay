import { prisma } from '@/shared/lib/prisma'
import type { SitemapCity, SitemapLodging, SitemapPoi } from '../lib/sitemap'

/** Données publiques indexables pour le sitemap : villes actives + POI actifs (avec slugs ville/catégorie). */
export async function getSitemapData(): Promise<{ cities: SitemapCity[]; pois: SitemapPoi[]; lodgings: SitemapLodging[] }> {
  const [cities, pois, lodgings] = await Promise.all([
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
    prisma.lodgingPublicProfile.findMany({
      where: {
        publication_status: 'published',
        deleted_at: null,
        city: { is_active: true, deleted_at: null },
        lodging: { is_active: true, deleted_at: null },
      },
      select: {
        slug: true,
        updated_at: true,
        city: { select: { slug: true } },
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
    lodgings: lodgings.map(lodging => ({
      slug: lodging.slug,
      city_slug: lodging.city.slug,
      updated_at: lodging.updated_at,
    })),
  }
}
