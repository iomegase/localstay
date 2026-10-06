import { composeLodgingAddress, splitLodgingAddress } from '@/features/guide-customization/lib/address'

// Spec 080 — adresse structurée.
describe('080 AC-01-02 — recomposition', () => {
  it('« numéro rue, code postal ville »', () => {
    expect(composeLodgingAddress({ number: '12', street: 'rue des Alpages', postal_code: '74170', city: 'Saint-Gervais-les-Bains' }))
      .toBe('12 rue des Alpages, 74170 Saint-Gervais-les-Bains')
  })

  it('parties manquantes ignorées, rien → null', () => {
    expect(composeLodgingAddress({ number: null, street: 'Chemin du Bettex', postal_code: '', city: 'Saint-Gervais-les-Bains' }))
      .toBe('Chemin du Bettex, Saint-Gervais-les-Bains')
    expect(composeLodgingAddress({ number: ' ', street: '', postal_code: null, city: null })).toBeNull()
  })
})

describe('080 AC-01-03 — reprise d’une adresse libre', () => {
  it('découpe le format courant', () => {
    expect(splitLodgingAddress('12 rue des Alpages, 74170 Saint-Gervais-les-Bains')).toEqual({
      number: '12', street: 'rue des Alpages', postal_code: '74170', city: 'Saint-Gervais-les-Bains',
    })
    expect(splitLodgingAddress('12 bis avenue du Mont d’Arbois 74120 Megève')).toEqual({
      number: '12 bis', street: 'avenue du Mont d’Arbois', postal_code: '74120', city: 'Megève',
    })
  })

  it('sans numéro ni code postal reconnaissable : tout dans la rue', () => {
    expect(splitLodgingAddress('Hameau du Bettex')).toEqual({ number: null, street: 'Hameau du Bettex', postal_code: null, city: null })
    expect(splitLodgingAddress(null)).toEqual({ number: null, street: null, postal_code: null, city: null })
  })
})
