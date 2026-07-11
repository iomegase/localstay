import { isValidLucideIconSlug } from '@/features/admin-taxonomy/lib/icons'

describe('017 admin taxonomy icon validation', () => {
  it('AC-02-03/BR-12: accepts supported Lucide slugs from the recommended taxonomy', () => {
    expect(isValidLucideIconSlug('utensils')).toBe(true)
    expect(isValidLucideIconSlug('coffee')).toBe(true)
    expect(isValidLucideIconSlug('croissant')).toBe(true)
    expect(isValidLucideIconSlug('mountain')).toBe(true)
    expect(isValidLucideIconSlug('popcorn')).toBe(true)
    expect(isValidLucideIconSlug('shopping-bag')).toBe(true)
    expect(isValidLucideIconSlug('shopping-basket')).toBe(true)
    expect(isValidLucideIconSlug('snowflake')).toBe(true)
  })

  it('AC-02-03/BR-12: rejects empty or unknown icon slugs', () => {
    expect(isValidLucideIconSlug('')).toBe(false)
    expect(isValidLucideIconSlug('not-a-real-icon')).toBe(false)
  })
})
