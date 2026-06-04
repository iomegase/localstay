import { countWords, WELCOME_MESSAGE_MAX_WORDS } from '@/features/guide-customization/lib/validation'

describe('countWords (limite du message d’accueil owner)', () => {
  it('returns 0 for empty or whitespace-only text', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   \n\t  ')).toBe(0)
  })

  it('counts single and multiple words', () => {
    expect(countWords('Bienvenue')).toBe(1)
    expect(countWords('Bienvenue chez nous')).toBe(3)
  })

  it('collapses any run of whitespace (spaces, tabs, newlines) into one separator', () => {
    // 4 mots séparés par espaces multiples / tab / retour ligne
    expect(countWords('un   deux\n\ntrois\tquatre')).toBe(4)
    expect(countWords('  mot1   mot2  ')).toBe(2)
  })

  it('exposes a 400-word limit', () => {
    expect(WELCOME_MESSAGE_MAX_WORDS).toBe(400)
    const exactly400 = Array.from({ length: 400 }, () => 'mot').join(' ')
    const over400 = Array.from({ length: 401 }, () => 'mot').join(' ')
    expect(countWords(exactly400)).toBe(400)
    expect(countWords(over400)).toBe(401)
  })
})
