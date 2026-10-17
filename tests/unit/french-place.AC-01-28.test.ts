import { atPlace, capitalizeFirst, ofPlace } from '@/shared/lib/french-place'

describe('031 AC-01-28 — prépositions devant un nom de commune', () => {
  it.each([
    ['Saint-Gervais-les-Bains', 'à Saint-Gervais-les-Bains', 'de Saint-Gervais-les-Bains'],
    ['Les Contamines-Montjoie', 'aux Contamines-Montjoie', 'des Contamines-Montjoie'],
    ['Le Fayet', 'au Fayet', 'du Fayet'],
    ['La Clusaz', 'à La Clusaz', 'de La Clusaz'],
    ["L'Alpe-d'Huez", "à L'Alpe-d'Huez", "de L'Alpe-d'Huez"],
    ['Annecy', 'à Annecy', 'd’Annecy'],
    ['Megève', 'à Megève', 'de Megève'],
    ['Lesquin', 'à Lesquin', 'de Lesquin'],
  ])('%s', (name, at, of) => {
    expect(atPlace(name)).toBe(at)
    expect(ofPlace(name)).toBe(of)
  })

  it('capitalizes the first letter for sentence starts', () => {
    expect(capitalizeFirst(atPlace('Les Contamines-Montjoie'))).toBe('Aux Contamines-Montjoie')
  })
})
