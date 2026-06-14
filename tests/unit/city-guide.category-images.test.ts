import {
  getCategoryImage,
  getFallbackGradient,
} from '@/features/city-guide/lib/category-images'

describe('category-images', () => {
  it('maps known slugs to their photo path', () => {
    expect(getCategoryImage('boulangerie')).toBe('/home/bakery.png')
    expect(getCategoryImage('rando')).toBe('/home/outdoor.png')
    expect(getCategoryImage('bars')).toBe('/home/pub.png')
    expect(getCategoryImage('culture')).toBe('/home/art.png')
    expect(getCategoryImage('diner')).toBe('/home/resto.png')
    expect(getCategoryImage('restaurants')).toBe('/home/resto.png')
  })

  it('returns null for unmapped slugs', () => {
    expect(getCategoryImage('mobilite')).toBeNull()
    expect(getCategoryImage('location-de-ski')).toBeNull()
  })

  it('returns a deterministic gradient class for the same slug', () => {
    const a = getFallbackGradient('mobilite')
    const b = getFallbackGradient('mobilite')
    expect(a).toBe(b)
    expect(a).toMatch(/from-\[#/)
  })
})
