import { listPublishedLocalLandingPaths } from '../queries/landing-pages'

export async function localSeoSitemapPaths(publishedLodgingCitySlugs: string[]): Promise<string[]> {
  return listPublishedLocalLandingPaths(publishedLodgingCitySlugs)
}
