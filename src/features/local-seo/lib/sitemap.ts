import {
  getLocalSeoDestination,
  listPublishedServiceDestinations,
} from '../content/destinations'
import { localSeoPath } from './paths'

export function localSeoSitemapPaths(publishedLodgingCitySlugs: string[]): string[] {
  const servicePaths = (['concierge', 'seminar'] as const).flatMap(intent =>
    listPublishedServiceDestinations(intent).map(destination =>
      localSeoPath(intent, destination.slug),
    ),
  )
  const lodgingPaths = [...new Set(publishedLodgingCitySlugs)]
    .filter(citySlug => getLocalSeoDestination(citySlug) !== null)
    .map(citySlug => localSeoPath('vacation-rental', citySlug))

  return [...servicePaths, ...lodgingPaths]
}
