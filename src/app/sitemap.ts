import type { MetadataRoute } from 'next'
import { buildSitemapEntries } from '@/features/seo/lib/sitemap'
import { getSitemapData } from '@/features/seo/queries/sitemap-data'
import { siteBaseUrl } from '@/features/seo/lib/site'
import { localSeoSitemapPaths } from '@/features/local-seo/lib/sitemap'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { cities, pois, lodgings, blogArticles } = await getSitemapData()
  const localLandingPaths = await localSeoSitemapPaths(
    lodgings.flatMap(lodging => lodging.city_slug ? [lodging.city_slug] : []),
  )
  return buildSitemapEntries({
    baseUrl: siteBaseUrl(),
    cities,
    pois,
    lodgings,
    blogArticles,
    staticPaths: [
      '/decouvrir',
      '/concept',
      '/seminaires',
      '/confier-mon-logement',
      '/logements',
      '/blog',
      ...localLandingPaths,
    ],
  })
}
