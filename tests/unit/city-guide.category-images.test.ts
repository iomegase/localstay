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

  it('returns the mapped asset for newly illustrated slugs', () => {
    expect(getCategoryImage('mobilite')).toBe('/home/mobilite.png')
    expect(getCategoryImage('location-de-ski')).toBe('/home/location-de-skis.png')
  })

  it('returns null for still-unmapped slugs', () => {
    expect(getCategoryImage('urgences')).toBeNull()
    expect(getCategoryImage('famille')).toBeNull()
  })

  it('returns a deterministic gradient class for the same slug', () => {
    const a = getFallbackGradient('mobilite')
    const b = getFallbackGradient('mobilite')
    expect(a).toBe(b)
    expect(a).toMatch(/from-\[#/)
  })
})
