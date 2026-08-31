import {
  hasValidLodgingCookie,
  isGuideCityLanding,
  isGuidePath,
  isLegacyDiscoveryGuidePath,
  isPrivateGuideCompatibilityPath,
  isValidLodgingId,
} from '@/features/seo/lib/route-policy'

const LODGING_ID = 'dc682b31-d390-4a3b-ae2e-e7342581535f'

describe('042 SEO route policy — BR-27', () => {
  describe('isValidLodgingId', () => {
    it.each([
      LODGING_ID,
      'DC682B31-D390-4A3B-AE2E-E7342581535F',
    ])('accepts the strict RFC UUID %s', value => {
      expect(isValidLodgingId(value)).toBe(true)
    })

    it.each([
      null,
      undefined,
      '',
      'javascript:alert(1)',
      'dc682b31d3904a3bae2ee7342581535f',
      'dc682b31-d390-0a3b-ae2e-e7342581535f',
      'dc682b31-d390-4a3b-7e2e-e7342581535f',
      '00000000-0000-0000-0000-000000000000',
    ])('rejects a non-lodging UUID value %p', value => {
      expect(isValidLodgingId(value)).toBe(false)
    })
  })

  it.each([
    ['/guide/annecy', true],
    ['/guide/annecy/restaurants', true],
    ['/guide', false],
    ['/guidebook/annecy', false],
    ['/decouvrir/annecy', false],
  ])('classifies %s as a guide path: %s', (pathname, expected) => {
    expect(isGuidePath(pathname)).toBe(expected)
  })

  it.each([
    ['/guide/annecy', true],
    ['/guide/annecy/', true],
    ['/guide/annecy/restaurants', false],
    ['/guide', false],
  ])('classifies %s as a City landing: %s', (pathname, expected) => {
    expect(isGuideCityLanding(pathname)).toBe(expected)
  })

  it.each([
    ['/guide/annecy', true],
    ['/guide/annecy/restaurants', true],
    ['/guide/annecy/restaurants/le-port', true],
    ['/guide/annecy/logements', false],
    ['/guide/annecy/logements/chalet', false],
    ['/guide/annecy/contact', false],
    ['/guide/annecy/agenda', false],
    ['/guide/annecy/restaurants/le-port/start', false],
  ])('classifies %s as an anonymous legacy discovery route: %s', (pathname, expected) => {
    expect(isLegacyDiscoveryGuidePath(pathname)).toBe(expected)
  })

  it.each([
    ['/guide/annecy', false],
    ['/guide/annecy/logements', false],
    ['/guide/annecy/logements/chalet', false],
    ['/guide/annecy/contact', true],
    ['/guide/annecy/agenda', true],
    ['/guide/annecy/mes-favoris', true],
    ['/guide/annecy/restaurants', true],
    ['/guide/annecy/restaurants/le-port', true],
    ['/guide/annecy/restaurants/le-port/start', true],
  ])('classifies %s as private guide compatibility: %s', (pathname, expected) => {
    expect(isPrivateGuideCompatibilityPath(pathname)).toBe(expected)
  })

  it('validates an active cookie and optionally requires the QR lodging match', () => {
    expect(hasValidLodgingCookie(LODGING_ID)).toBe(true)
    expect(hasValidLodgingCookie(LODGING_ID, LODGING_ID)).toBe(true)
    expect(hasValidLodgingCookie(LODGING_ID.toUpperCase(), LODGING_ID)).toBe(true)
    expect(hasValidLodgingCookie(LODGING_ID, '11111111-1111-4111-8111-111111111111')).toBe(false)
    expect(hasValidLodgingCookie('not-an-id')).toBe(false)
    expect(hasValidLodgingCookie(undefined)).toBe(false)
  })
})
