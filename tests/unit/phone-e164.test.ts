import { formatPhone, normalizePhone, phoneHref, PhoneSchema } from '@/shared/lib/phone'
import { normalizeUsefulNumbersText } from '@/features/guide-customization/lib/useful-numbers'

// Spec 096 — cas réels rencontrés en base le 2026-10-08.
describe('spec 096 — numéros au format international', () => {
  it.each([
    ['04 50 47 78 95', '+33450477895'],
    ['0623166356', '+33623166356'],
    ['0 825 09 09 09', '+33825090909'],
    ['0033 4 50 47 78 95', '+33450477895'],
    ['+33 (0)4 50 47 78 95', '+33450477895'],
    ['+330450477895', '+33450477895'],
    ['04.50.47.78.95', '+33450477895'],
    ['+33664753535', '+33664753535'],
  ])('AC-01 : %s → %s', (raw, stored) => {
    expect(normalizePhone(raw)).toBe(stored)
    expect(normalizePhone(stored)).toBe(stored)
  })

  it.each([
    ['+41 22 123 45 67', '+41221234567'],
    ['0041 22 123 45 67', '+41221234567'],
    ['022 347 03 18', '022 347 03 18'], // national suisse : pays ambigu, conservé
    ['15', '15'], ['112', '112'], ['3624', '3624'],
    ['00000000', '00000000'], // numéro factice
    ['Voir le site', 'Voir le site'],
  ])('AC-02 / BR-02 : %s → %s', (raw, stored) => {
    expect(normalizePhone(raw)).toBe(stored)
  })

  it('vide → null', () => {
    expect(normalizePhone('  ')).toBeNull()
    expect(normalizePhone(null)).toBeNull()
    expect(PhoneSchema.parse('')).toBeNull()
    expect(PhoneSchema.parse('06 12 34 56 78')).toBe('+33612345678')
  })

  it('AC-03 / AC-04 : lien d’appel en +33, affichage groupé', () => {
    expect(phoneHref('04 50 47 78 95')).toBe('tel:+33450477895')
    expect(formatPhone('+33450477895')).toBe('+33 4 50 47 78 95')
    expect(phoneHref('112')).toBe('tel:112')
    expect(phoneHref('Voir le site')).toBe('')
    expect(formatPhone('+41221234567')).toBe('+41221234567')
  })

  it('numéros utiles : ligne par ligne, rien de perdu', () => {
    expect(normalizeUsefulNumbersText('Conciergerie: +33 6 07 85 90 58\nMairie: 04 50 47 75 66\nNote sans numéro\nSamu: 15'))
      .toBe('Conciergerie: +33607859058\nMairie: +33450477566\nNote sans numéro\nSamu: 15')
  })
})
