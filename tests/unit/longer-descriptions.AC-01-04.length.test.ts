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
  it('PO 2026-10-08 : consigne Markdown (gras, intertitres ##, liste courte, pas de titre #)', () => {
    expect(DESCRIPTION_LENGTH_INSTRUCTION).toContain('Rédige en Markdown')
    expect(DESCRIPTION_LENGTH_INSTRUCTION).toContain('**gras**')
    expect(DESCRIPTION_LENGTH_INSTRUCTION).toContain('intertitres « ## »')
    expect(DESCRIPTION_LENGTH_INSTRUCTION).toContain('Pas de titre « # »')
  })

  it('le compteur ignore les marqueurs Markdown', () => {
    expect(countWords('## Une brasserie\n\nLa **Brasserie** du Mont Blanc :\n\n- terrasse\n- groupes')).toBe(9)
  })

  it('la coupe ne laisse pas un intertitre seul en fin de texte', () => {
    const sentence = 'Une phrase de dix mots pour remplir ce paragraphe ici.'
    const paragraph = Array.from({ length: 29 }, () => sentence).join(' ')
    // L'intertitre se termine par « ? » : il forme un segment à part, qui tient dans les 300 mots.
    const text = `${paragraph}\n\n## Intertitre final ?\n\n${sentence} ${sentence}`
    const limited = limitToWords(text)
    expect(limited.endsWith('ici.')).toBe(true)
    expect(limited).not.toContain('Intertitre final')
  })
})
