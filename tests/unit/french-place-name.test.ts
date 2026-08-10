import {
  formatFrenchWelcomeLine,
  formatFrenchPlaceReference,
} from '@/shared/lib/french-place'

describe('french place helpers', () => {
  it('formats the welcome line with the right French article', () => {
    expect(formatFrenchWelcomeLine('La Pieuca')).toBe('Bienvenue à la Pieuca')
    expect(formatFrenchWelcomeLine('Le Pieuca')).toBe('Bienvenue au Pieuca')
    expect(formatFrenchWelcomeLine('Les Chalets')).toBe('Bienvenue aux Chalets')
    expect(formatFrenchWelcomeLine('L\'Ermitage')).toBe('Bienvenue à l\'Ermitage')
    expect(formatFrenchWelcomeLine('Chalet du Lac')).toBe('Bienvenue à Chalet du Lac')
  })

  it('formats a place reference for a sentence', () => {
    expect(formatFrenchPlaceReference('La Pieuca')).toBe('à la Pieuca')
    expect(formatFrenchPlaceReference('Le Pieuca')).toBe('au Pieuca')
    expect(formatFrenchPlaceReference('Les Chalets')).toBe('aux Chalets')
    expect(formatFrenchPlaceReference('L\'Ermitage')).toBe('à l\'Ermitage')
    expect(formatFrenchPlaceReference('Chalet du Lac')).toBe('à Chalet du Lac')
  })
})
