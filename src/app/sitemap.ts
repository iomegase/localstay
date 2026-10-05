import type { MetadataRoute } from 'next'
import { buildSitemapEntries } from '@/features/seo/lib/sitemap'
import { getSitemapData } from '@/features/seo/queries/sitemap-data'
import { siteBaseUrl } from '@/features/seo/lib/site'
import { localSeoSitemapPaths } from '@/features/local-seo/lib/sitemap'

// Les actions de l'admin revalident le sitemap à la demande ; une modification faite
// hors de l'admin (script, base) est reprise au plus tard au bout d'une heure.
export const revalidate = 3600

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
      '/seminaires',
      '/confier-mon-logement',
      '/logements',
      '/journal',
      '/mentions-legales',
      '/confidentialite',
      '/cgu',
      ...localLandingPaths,
    ],
  })
}
