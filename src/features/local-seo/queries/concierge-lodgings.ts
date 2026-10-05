import { listPublishedLodgings } from '@/features/lodging-showcase/queries/public-lodgings'
import { conciergeLodgingCitySlugs, selectConciergeLodgings } from '../lib/concierge-lodgings'

export async function listConciergeLodgings(citySlug: string) {
  const lodgings = await listPublishedLodgings({ citySlugs: conciergeLodgingCitySlugs })
  return selectConciergeLodgings(lodgings, citySlug)
}
