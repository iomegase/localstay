import { capitalizeFirst } from '@/shared/lib/utils'

describe('capitalizeFirst', () => {
  it('uppercases the first letter and keeps the rest', () => {
    expect(capitalizeFirst('restaurants')).toBe('Restaurants')
    expect(capitalizeFirst('bars à vin')).toBe('Bars à vin')
  })

  it('handles accented first letters', () => {
    expect(capitalizeFirst('école de ski')).toBe('École de ski')
  })

  it('leaves an already-capitalized string unchanged', () => {
    expect(capitalizeFirst('Musée Alpin')).toBe('Musée Alpin')
  })

  it('returns empty for empty input', () => {
    expect(capitalizeFirst('')).toBe('')
  })
})
