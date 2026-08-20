import type { Prisma } from '@prisma/client'
import { getDiscoveryPoiVisibility } from '@/features/public-discovery/lib/visibility'
import { prisma } from '@/shared/lib/prisma'
import type { SitemapBlogArticle, SitemapCity, SitemapLodging, SitemapPoi } from '../lib/sitemap'

/** Données indexables : destinations dérivées exclusivement des POI visibles selon BR-04/08/10. */
export async function getSitemapData(): Promise<{ cities: SitemapCity[]; pois: SitemapPoi[]; lodgings: SitemapLodging[]; blogArticles: SitemapBlogArticle[] }> {
  const publicPoiWhere = {
    discovery_status: 'PUBLISHED',
    discovery_published_at: { not: null },
    is_active: true,
    deleted_at: null,
    geocode_status: 'success',
    city: { is_active: true, deleted_at: null },
    category: { is_active: true, deleted_at: null },
    OR: [
      { subcategory_id: null },
      { subcategory: { is: { is_active: true, deleted_at: null } } },
    ],
  } satisfies Prisma.PointOfInterestWhereInput

  const [pois, lodgings, blogArticles] = await Promise.all([
    prisma.pointOfInterest.findMany({
      where: publicPoiWhere,
      select: {
        name: true,
        slug: true,
        description: true,
        address: true,
        latitude: true,
        longitude: true,
        phone: true,
        website: true,
        photos: true,
        discovery_status: true,
        discovery_published_at: true,
        is_active: true,
        deleted_at: true,
        geocode_status: true,
        subcategory_id: true,
        city: {
          select: {
            slug: true,
            latitude: true,
            longitude: true,
            is_active: true,
            deleted_at: true,
          },
        },
        category: {
          select: {
            id: true,
            slug: true,
            is_active: true,
            deleted_at: true,
          },
        },
        subcategory: {
          select: {
            category_id: true,
            is_active: true,
            deleted_at: true,
          },
        },
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
    prisma.blogArticle.findMany({
      where: {
        status: 'published',
        deleted_at: null,
        NOT: { published_at: null },
      },
      select: {
        slug: true,
        updated_at: true,
      },
    }),
  ])

  const visiblePois = pois
    .filter(poi => getDiscoveryPoiVisibility(poi) !== null)
    .sort((left, right) => (
      compareText(left.city.slug, right.city.slug)
      || compareText(left.category.slug, right.category.slug)
      || compareText(left.slug, right.slug)
    ))
  const citySlugs = new Set<string>()
  for (const poi of visiblePois) {
    citySlugs.add(poi.city.slug)
  }

  return {
    cities: [...citySlugs].map(slug => ({ slug })),
    pois: visiblePois.map(poi => ({
      slug: poi.slug,
      city_slug: poi.city.slug,
      category_slug: poi.category.slug,
    })),
    lodgings: lodgings.map(lodging => ({
      slug: lodging.slug,
      city_slug: lodging.city.slug,
      updated_at: lodging.updated_at,
    })),
    blogArticles: blogArticles.map(article => ({
      slug: article.slug,
      updated_at: article.updated_at,
    })),
  }
}

function compareText(left: string, right: string): number {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}
