import { normalizeCommuneName, isInseeCode, communeMatches } from '@/features/events-acquisition/lib/commune'

describe('commune helpers', () => {
  it('normalise accents, casse et séparateurs', () => {
    expect(normalizeCommuneName('Saint-Gervais-les-Bains')).toBe('saint gervais les bains')
    expect(normalizeCommuneName('Les Contamines-Montjoie')).toBe('les contamines montjoie')
  })

  it('reconnaît un code INSEE à 5 chiffres', () => {
    expect(isInseeCode('74236')).toBe(true)
    expect(isInseeCode('chamonix')).toBe(false)
  })

  it('matche par INSEE exact', () => {
    const ev = { communeInsee: '74236', communeName: 'Saint-Gervais-les-Bains' }
    expect(communeMatches('74236', ev)).toBe(true)
    expect(communeMatches('74056', ev)).toBe(false)
  })

  it('matche par nom partiel insensible aux accents/casse', () => {
    const ev = { communeInsee: '74056', communeName: 'Chamonix-Mont-Blanc' }
    expect(communeMatches('chamonix', ev)).toBe(true)
    expect(communeMatches('CHAMONIX', ev)).toBe(true)
    expect(communeMatches('megève', ev)).toBe(false)
  })
})
