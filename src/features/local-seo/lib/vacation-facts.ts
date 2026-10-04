import type { MarketingLodgingCard } from '@/features/lodging-showcase/queries/public-lodgings'

// Faits du hero dérivés uniquement des logements publiés (spec 046 AC-03-06).
export function vacationFacts(lodgings: Pick<MarketingLodgingCard, 'max_guests'>[]): string | null {
  if (lodgings.length === 0) return null

  const count = `${lodgings.length} ${lodgings.length > 1 ? 'logements' : 'logement'}`
  const capacities = lodgings.map(lodging => lodging.max_guests)
  const min = Math.min(...capacities)
  const max = Math.max(...capacities)
  const guests = min === max ? `jusqu’à ${max} voyageurs` : `de ${min} à ${max} voyageurs`

  return `${count} · ${guests}`
}

export function lodgingCountLabel(count: number): string {
  return `${count} ${count > 1 ? 'logements' : 'logement'}`
}
