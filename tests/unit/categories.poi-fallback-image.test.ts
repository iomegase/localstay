import { getPoiFallbackImage } from '@/features/categories/lib/poi-fallback-image'

describe('getPoiFallbackImage', () => {
  it('returns the restaurant fallback for restaurant categories', () => {
    expect(getPoiFallbackImage('restaurants', 'Gastronomique')).toBe('/fallback/fallback-restaurant.png')
  })

  it('returns the rando fallback for trail categories', () => {
    expect(getPoiFallbackImage('rando', null)).toBe('/fallback/fallback-rando.png')
    expect(getPoiFallbackImage('explorer', 'Randonnée')).toBe('/fallback/fallback-rando.png')
  })

  it('returns the alimentation fallback for bakery and food subcategories', () => {
    expect(getPoiFallbackImage('commerces', 'Boulangerie')).toBe('/fallback/fallback-boulangerie.png')
    expect(getPoiFallbackImage('alimentation', null)).toBe('/fallback/fallback-alimentation.png')
  })

  it('returns the ski rental fallback for ski rental labels', () => {
    expect(getPoiFallbackImage('services', 'Location de ski')).toBe('/fallback/fallback-location-de-ski.png')
  })

  it('returns dedicated fallbacks for cafe, concert and transport labels', () => {
    expect(getPoiFallbackImage('cafes', null)).toBe('/fallback/fallback-cafe.png')
    expect(getPoiFallbackImage('agenda', 'Concerts')).toBe('/fallback/fallback-concert.png')
    expect(getPoiFallbackImage('services', 'Mobilité')).toBe('/fallback/fallback-transport.png')
  })

  it('uses the cinema fallback instead of the culture fallback for cinema labels', () => {
    expect(getPoiFallbackImage('culture', 'Cinéma')).toBe('/fallback/fallback-cinema.png')
    expect(getPoiFallbackImage('cinema', null)).toBe('/fallback/fallback-cinema.png')
  })
})
