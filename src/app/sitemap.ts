import type { MetadataRoute } from 'next'
import { buildSitemapEntries } from '@/features/seo/lib/sitemap'
import { getSitemapData } from '@/features/seo/queries/sitemap-data'
import { siteBaseUrl } from '@/features/seo/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { cities, pois, lodgings } = await getSitemapData()
  return buildSitemapEntries({
    baseUrl: siteBaseUrl(),
    cities,
    pois,
    lodgings,
    staticPaths: ['/contact'],
  })
}
