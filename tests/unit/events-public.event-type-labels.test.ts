import { typeLabel, buildTypeFacets } from '@/features/events-public/lib/event-type-labels'

describe('typeLabel', () => {
  it('mappe chaque EventType vers son libellé FR', () => {
    expect(typeLabel('cultural')).toBe('Culturel')
    expect(typeLabel('sport')).toBe('Sport')
    expect(typeLabel('market')).toBe('Marché')
    expect(typeLabel('festival')).toBe('Festival')
    expect(typeLabel('social')).toBe('Animation')
    expect(typeLabel('other')).toBe('Autre')
  })
})

describe('buildTypeFacets', () => {
  it('compte les types présents et trie par compteur décroissant', () => {
    const facets = buildTypeFacets([
      ['cultural'],
      ['cultural', 'festival'],
      ['sport'],
    ])
    expect(facets).toEqual([
      { type: 'cultural', label: 'Culturel', count: 2 },
      { type: 'festival', label: 'Festival', count: 1 },
      { type: 'sport', label: 'Sport', count: 1 },
    ])
  })
  it('renvoie un tableau vide quand il n’y a aucun événement', () => {
    expect(buildTypeFacets([])).toEqual([])
  })
})
