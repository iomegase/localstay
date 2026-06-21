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
