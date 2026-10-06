import { FAQ_LIBRARY, fillFaqTemplate, missingLibraryItems, needsAdaptation } from '@/features/lodging-showcase/lib/faq-library'

// Spec 082 — bibliothèque de FAQ génériques.
describe('082 AC-01-01 — contenu', () => {
  it('13 questions, identifiants uniques, sans mention du logement d’origine', () => {
    expect(FAQ_LIBRARY).toHaveLength(13)
    expect(new Set(FAQ_LIBRARY.map(item => item.id)).size).toBe(13)
    for (const item of FAQ_LIBRARY) {
      expect(`${item.question} ${item.answer}`).not.toMatch(/Le 305|Saint[- ]Gervais/i)
      expect(item.question.trim().endsWith('?')).toBe(true)
    }
  })

  it('BR-03 : horaires du guide (arrivée 16 h, départ 10 h)', () => {
    const schedule = FAQ_LIBRARY.find(item => item.id === 'horaires')!
    expect(schedule.answer).toContain('16 h')
    expect(schedule.answer).toContain('10 h')
  })
})

describe('082 AC-01-02 — remplissage', () => {
  const capacity = FAQ_LIBRARY.find(item => item.id === 'capacite')!
  const centre = FAQ_LIBRARY.find(item => item.id === 'centre')!

  it('ville, voyageurs, chambres', () => {
    expect(fillFaqTemplate(capacity, { cityName: 'Megève', maxGuests: 4, bedroomCount: 2 }).answer).toContain('jusqu’à 4 personnes')
    expect(fillFaqTemplate(centre, { cityName: 'Megève', maxGuests: 4, bedroomCount: 2 }).answer).toContain('centre de Megève')
  })

  it('information manquante → forme générique, jamais d’accolade', () => {
    for (const item of FAQ_LIBRARY) {
      const filled = fillFaqTemplate(item, { cityName: null, maxGuests: null, bedroomCount: null })
      expect(`${filled.question} ${filled.answer}`).not.toMatch(/[{}]/)
    }
  })
})

describe('082 AC-01-03 / AC-02-02 — à adapter, doublons', () => {
  it('détecte les passages entre crochets', () => {
    expect(needsAdaptation('Le ménage est [inclus / facturé séparément].')).toBe(true)
    expect(needsAdaptation('Le ménage est inclus.')).toBe(false)
  })

  it('ne propose pas une question déjà présente (casse et espaces ignorés)', () => {
    const present = [{ question: '  les animaux sont-ils ACCEPTÉS ? ', answer: 'Non.' }]
    const missing = missingLibraryItems(present)
    expect(missing).toHaveLength(12)
    expect(missing.some(item => item.id === 'animaux')).toBe(false)
  })
})
