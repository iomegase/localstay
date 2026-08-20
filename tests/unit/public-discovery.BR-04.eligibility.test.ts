import { getPoiDiscoveryEligibility } from '@/features/public-discovery/lib/eligibility'

const completePoi = {
  is_active: true,
  deleted_at: null,
  description: 'Une adresse locale vérifiée et décrite par MyStay.',
  address: '100 rue du Mont-Blanc, 74170 Saint-Gervais-les-Bains',
  latitude: 45.89,
  longitude: 6.71,
  geocode_status: 'success',
  phone: '+33450000000',
  website: null,
  photos: ['https://example.com/poi.jpg'],
  city: { is_active: true, deleted_at: null },
  category: { is_active: true, deleted_at: null },
  subcategory: null,
}

describe('041 BR-04 POI discovery eligibility', () => {
  it('accepts a strictly complete POI', () => {
    expect(getPoiDiscoveryEligibility(completePoi)).toEqual({ eligible: true, missing: [] })
  })

  it('rejects a blank description after trimming', () => {
    expect(getPoiDiscoveryEligibility({ ...completePoi, description: ' \n ' })).toEqual({
      eligible: false,
      missing: ['description'],
    })
  })

  it.each([
    ['an empty photo list', []],
    ['a list without a usable photo', ['https://example.com/logo.svg', 'not-a-url']],
  ])('rejects %s', (_label, photos) => {
    expect(getPoiDiscoveryEligibility({ ...completePoi, photos })).toEqual({
      eligible: false,
      missing: ['photo'],
    })
  })

  it.each([
    ['an arbitrary HTTP host', 'http://media.unlisted.test/poi.jpg'],
    ['an arbitrary HTTPS host', 'https://media.unlisted.test/poi.jpg'],
    ['a host configured for other optimized marketing images', 'https://images.unsplash.com/poi.jpg'],
  ])('keeps spec 022 photo eligibility for %s', (_label, photo) => {
    expect(getPoiDiscoveryEligibility({ ...completePoi, photos: [photo] })).toEqual({
      eligible: true,
      missing: [],
    })
  })

  it.each([
    ['pending geocoding', { geocode_status: 'pending' }],
    ['failed geocoding', { geocode_status: 'failed' }],
    ['a non-finite latitude', { latitude: Number.NaN }],
    ['a non-finite longitude', { longitude: Number.POSITIVE_INFINITY }],
  ])('rejects %s', (_label, patch) => {
    expect(getPoiDiscoveryEligibility({ ...completePoi, ...patch })).toEqual({
      eligible: false,
      missing: ['geocode'],
    })
  })

  it.each([
    ['no contact', { phone: null, website: null }],
    ['blank contact fields', { phone: ' ', website: ' ' }],
    ['a non-HTTP website', { phone: null, website: 'ftp://example.com' }],
    ['an invalid website', { phone: null, website: 'not-a-url' }],
  ])('rejects %s', (_label, patch) => {
    expect(getPoiDiscoveryEligibility({ ...completePoi, ...patch })).toEqual({
      eligible: false,
      missing: ['contact'],
    })
  })

  it.each([
    ['a phone alone', { phone: ' +33 4 50 00 00 00 ', website: null }],
    ['an HTTP official website alone', { phone: null, website: 'http://example.com' }],
    ['an HTTPS official website alone', { phone: null, website: 'https://example.com' }],
  ])('accepts %s as contact', (_label, patch) => {
    expect(getPoiDiscoveryEligibility({ ...completePoi, ...patch })).toEqual({
      eligible: true,
      missing: [],
    })
  })

  it.each([
    ['an inactive POI', { is_active: false }],
    ['a soft-deleted POI', { deleted_at: new Date('2026-08-20T15:00:00.000Z') }],
  ])('rejects %s', (_label, patch) => {
    expect(getPoiDiscoveryEligibility({ ...completePoi, ...patch })).toEqual({
      eligible: false,
      missing: ['active'],
    })
  })

  it.each([
    ['an inactive City', { is_active: false, deleted_at: null }],
    ['a soft-deleted City', { is_active: true, deleted_at: new Date('2026-08-20T15:00:00.000Z') }],
  ])('rejects %s', (_label, city) => {
    expect(getPoiDiscoveryEligibility({ ...completePoi, city })).toEqual({
      eligible: false,
      missing: ['city'],
    })
  })

  it.each([
    ['an inactive Category', { is_active: false, deleted_at: null }],
    ['a soft-deleted Category', { is_active: true, deleted_at: new Date('2026-08-20T15:00:00.000Z') }],
  ])('rejects %s', (_label, category) => {
    expect(getPoiDiscoveryEligibility({ ...completePoi, category })).toEqual({
      eligible: false,
      missing: ['category'],
    })
  })

  it.each([
    ['an inactive SubCategory', { is_active: false, deleted_at: null }],
    ['a soft-deleted SubCategory', { is_active: true, deleted_at: new Date('2026-08-20T15:00:00.000Z') }],
  ])('rejects %s when present', (_label, subcategory) => {
    expect(getPoiDiscoveryEligibility({ ...completePoi, subcategory })).toEqual({
      eligible: false,
      missing: ['subcategory'],
    })
  })

  it('allows a null SubCategory', () => {
    expect(getPoiDiscoveryEligibility({ ...completePoi, subcategory: null })).toEqual({
      eligible: true,
      missing: [],
    })
  })

  it('accumulates simultaneous defects in deterministic checklist order', () => {
    expect(getPoiDiscoveryEligibility({
      ...completePoi,
      is_active: false,
      city: { is_active: false, deleted_at: null },
      category: { is_active: true, deleted_at: new Date('2026-08-20T15:00:00.000Z') },
      subcategory: { is_active: false, deleted_at: null },
      description: ' ',
      photos: ['https://example.com/placeholder.jpg'],
      address: ' ',
      geocode_status: 'failed',
      phone: null,
      website: 'ftp://example.com',
    })).toEqual({
      eligible: false,
      missing: [
        'active',
        'city',
        'category',
        'subcategory',
        'description',
        'photo',
        'address',
        'geocode',
        'contact',
      ],
    })
  })

  it('rejects a blank address after trimming', () => {
    expect(getPoiDiscoveryEligibility({ ...completePoi, address: ' \t ' })).toEqual({
      eligible: false,
      missing: ['address'],
    })
  })
})
