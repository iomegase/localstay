import { selectConciergeLodgings } from '@/features/local-seo/lib/concierge-lodgings'

const cards = [
  { id: 'g1', city_slug: 'saint-gervais-les-bains' },
  { id: 'far', city_slug: 'paris' },
  { id: 'n1', city_slug: 'saint-nicolas-de-veroce' },
  { id: 'g2', city_slug: 'saint-gervais-les-bains' },
  { id: 'n2', city_slug: 'saint-nicolas-de-veroce' },
]
it('prioritises local profiles before nearby profiles and preserves their order', () => {
  expect(selectConciergeLodgings(cards, 'saint-nicolas-de-veroce').map(card => card.id)).toEqual(['n1', 'n2', 'g1'])
})
it('limits to three local profiles when enough are present', () => {
  expect(selectConciergeLodgings([...cards, { id: 'n3', city_slug: 'saint-nicolas-de-veroce' }], 'saint-nicolas-de-veroce').map(card => card.id)).toEqual(['n1', 'n2', 'n3'])
})
it('does not fill from distant destinations or duplicate a profile', () => {
  expect(selectConciergeLodgings([cards[1], cards[0], cards[0]], 'saint-nicolas-de-veroce').map(card => card.id)).toEqual(['g1'])
})
it('returns an empty list when no eligible profile exists', () => {
  expect(selectConciergeLodgings([cards[1]], 'saint-nicolas-de-veroce')).toEqual([])
})
