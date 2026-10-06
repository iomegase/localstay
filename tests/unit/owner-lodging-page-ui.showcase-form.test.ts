import { evaluateProfileCompleteness } from '@/features/lodging-showcase/lib/completeness'
import {
  lengthInRange,
  missingFieldLabel,
  publicationStatusLabel,
  SEO_TITLE_RANGE,
  SHOWCASE_SECTIONS,
} from '@/features/lodging-showcase/lib/showcase-form'

// Spec 079 — page Logement.
describe('079 — modèle de la page Logement', () => {
  it('AC-03-01 : sept sections dans l’ordre', () => {
    expect(SHOWCASE_SECTIONS.map(section => section.title)).toEqual([
      'Présentation', 'Caractéristiques', 'Équipements', 'Photos', 'FAQ', 'Réservation et contact', 'Référencement',
    ])
  })

  it('AC-03-02 / AC-03-03 : statuts et champs manquants en français', () => {
    expect(publicationStatusLabel('draft')).toBe('Brouillon')
    expect(publicationStatusLabel('review')).toBe('En revue')
    expect(missingFieldLabel('cover_photo')).toBe('Une photo de couverture')
    expect(missingFieldLabel('inconnu')).toBe('inconnu')
  })

  it('AC-03-01 : longueur SEO (vide accepté)', () => {
    expect(lengthInRange('', SEO_TITLE_RANGE)).toBe(true)
    expect(lengthInRange('trop court', SEO_TITLE_RANGE)).toBe(false)
    expect(lengthInRange('x'.repeat(40), SEO_TITLE_RANGE)).toBe(true)
  })

  it('AC-01-02 : la confirmation des droits n’est plus exigée', () => {
    const result = evaluateProfileCompleteness({
      title: 'Chalet Hygge', short_description: 'Un chalet', description: 'x'.repeat(120),
      property_type: 'Chalet', max_guests: 4,
      photos: [{ url: 'u', alt: 'Salon', is_cover: true }],
      amenities: [{ code: 'a', label: 'A' }, { code: 'b', label: 'B' }, { code: 'c', label: 'C' }],
    })
    expect(result.missingFields).toEqual([])
    expect(result.canSubmitForReview).toBe(true)
  })
})

describe('079 AC-01-03 / AC-02-01 — routes retirées', () => {
  it.each(['rights-confirmation', 'source-url'])('…/public-profile/%s n’existe plus', segment => {
    const { existsSync } = jest.requireActual<typeof import('fs')>('fs')
    const { join } = jest.requireActual<typeof import('path')>('path')
    expect(existsSync(join(process.cwd(), 'src/app/api/dashboard/lodgings/[id]/public-profile', segment))).toBe(false)
  })
})
