import { filterPoisByQuery, formatDistanceMeters, guideCityTitle } from '@/features/guide-app/components/stay/poi-search'

const pois = [
  { name: 'Brasserie du Mont Blanc', category: { name: 'Restaurant' }, description: 'Cuisine savoyarde' },
  { name: 'Lulu', category: { name: 'Cafés' }, shortDescription: 'Pâtisserie et thé' },
  { name: 'Pharmacie', category: { name: 'Urgences' } },
]

describe('056 search helpers', () => {
  it('AC-01-02: matches name, category or description, ignoring case and accents', () => {
    expect(filterPoisByQuery(pois, 'mont').map(poi => poi.name)).toEqual(['Brasserie du Mont Blanc'])
    expect(filterPoisByQuery(pois, 'cafe').map(poi => poi.name)).toEqual(['Lulu'])
    expect(filterPoisByQuery(pois, 'PATISSERIE').map(poi => poi.name)).toEqual(['Lulu'])
    expect(filterPoisByQuery(pois, 'savoyarde').map(poi => poi.name)).toEqual(['Brasserie du Mont Blanc'])
    expect(filterPoisByQuery(pois, '   ')).toHaveLength(3)
  })

  it('AC-01-04: formats crow-fly distances', () => {
    expect(formatDistanceMeters(347)).toBe('350 m')
    expect(formatDistanceMeters(4)).toBe('10 m')
    expect(formatDistanceMeters(1234)).toBe('1,2 km')
    expect(formatDistanceMeters(15400)).toBe('15 km')
  })

  it('AC-01-01: titles the tab with the town name', () => {
    expect(guideCityTitle('Saint-Gervais-les-Bains')).toBe('Saint-Gervais')
    expect(guideCityTitle('Chamonix-Mont-Blanc')).toBe('Chamonix-Mont-Blanc')
  })
})
