import { AMENITY_CATALOG, AMENITY_CATALOG_CODES } from '@/features/lodging-showcase/lib/amenity-catalog'

describe('AMENITY_CATALOG', () => {
  it('has unique codes', () => {
    const codes = AMENITY_CATALOG.map(item => item.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('has at least one included item and one on_request item', () => {
    expect(AMENITY_CATALOG.some(item => item.availability === 'included')).toBe(true)
    expect(AMENITY_CATALOG.some(item => item.availability === 'on_request')).toBe(true)
  })

  it('has a non-empty label for every item', () => {
    for (const item of AMENITY_CATALOG) {
      expect(item.label.trim().length).toBeGreaterThan(0)
    }
  })

  it('exposes a code set matching the catalog length', () => {
    expect(AMENITY_CATALOG_CODES.size).toBe(AMENITY_CATALOG.length)
  })
})

describe('028 AC-02-21 — petit-déjeuner compris dans le séjour', () => {
  it('offers breakfast both as an included amenity and as an on-request service', () => {
    expect(AMENITY_CATALOG).toContainEqual({ code: 'breakfast_included', label: 'Petit-déjeuner', availability: 'included' })
    expect(AMENITY_CATALOG).toContainEqual({ code: 'breakfast', label: 'Petit-déjeuner', availability: 'on_request' })
  })
})
