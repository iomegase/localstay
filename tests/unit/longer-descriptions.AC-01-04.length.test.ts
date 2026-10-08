import { countWords, DESCRIPTION_LENGTH_INSTRUCTION, limitToWords } from '@/shared/lib/description-length'

describe('spec 093 — longueur des descriptions', () => {
  it('consigne : 120 à 300 mots, paragraphes, pas de remplissage', () => {
    expect(DESCRIPTION_LENGTH_INSTRUCTION).toContain('120 à 300 mots')
    expect(DESCRIPTION_LENGTH_INSTRUCTION).toContain('jamais plus de 300 mots')
    expect(DESCRIPTION_LENGTH_INSTRUCTION).toContain('écris moins plutôt que de remplir')
  })

  it('AC-04 : texte court inchangé', () => {
    expect(limitToWords('  Deux phrases. Courtes.  ')).toBe('Deux phrases. Courtes.')
  })

  it('AC-04 : coupé à la dernière phrase complète, paragraphes conservés', () => {
    const paragraph = Array.from({ length: 10 }, (_, index) => `Phrase numéro ${index} avec quelques mots de plus pour remplir.`).join(' ')
    const text = `${paragraph}\n\n${paragraph}\n\n${paragraph}\n\n${paragraph}`
    expect(countWords(text)).toBeGreaterThan(300)
    const limited = limitToWords(text)
    expect(countWords(limited)).toBeLessThanOrEqual(300)
    expect(limited.endsWith('remplir.')).toBe(true)
    expect(limited).toContain('\n\n')
  })

  it('AC-04 : première phrase déjà trop longue → coupée au mot', () => {
    const limited = limitToWords(Array.from({ length: 400 }, () => 'mot').join(' '))
    expect(countWords(limited)).toBe(300)
    expect(limited.endsWith('…')).toBe(true)
  })
})
