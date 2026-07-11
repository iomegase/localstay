import { getPublicCategoryIconSlug } from '@/features/city-guide/lib/public-category-icon'

describe('public category icon overrides', () => {
  it('uses specific public icons for categories with legacy generic icons', () => {
    expect(getPublicCategoryIconSlug('boulangerie', 'coffee')).toBe('croissant')
    expect(getPublicCategoryIconSlug('cinéma', 'utensils')).toBe('popcorn')
    expect(getPublicCategoryIconSlug('location-de-skis', 'utensils')).toBe('snowflake')
    expect(getPublicCategoryIconSlug('alimentation', 'utensils')).toBe('shopping-basket')
  })

  it('keeps the stored icon when no public override exists', () => {
    expect(getPublicCategoryIconSlug('restaurant', 'utensils')).toBe('utensils')
    expect(getPublicCategoryIconSlug('unknown', null)).toBe('map-pin')
  })
})
