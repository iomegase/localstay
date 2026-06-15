import { buildLodgingRewritePrompt } from '@/features/lodging-showcase/lib/rewrite-prompt'

describe('lodging rewrite prompt', () => {
  it('forbids invention of facts and scraping', () => {
    const prompt = buildLodgingRewritePrompt({
      sourceText: 'Appartement lumineux avec balcon, proche du lac.',
      facts: {
        cityName: 'Annecy',
        maxGuests: 4,
        amenities: ['Wi-Fi', 'Parking', 'Cuisine'],
      },
    })

    expect(prompt).toContain('N invente aucun equipement')
    expect(prompt).toContain('N ajoute aucun prix')
    expect(prompt).toContain('Retourne uniquement du JSON')
    expect(prompt).toContain('Texte source Owner')
  })
})
