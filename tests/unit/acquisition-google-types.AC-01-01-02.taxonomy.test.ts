import { readFileSync } from 'fs'
import { join } from 'path'
import { formatGoogleTypesInput, parseGoogleTypesInput } from '@/features/admin-taxonomy/lib/google-types-input'
import { RECOMMENDED_TAXONOMY } from '@/features/admin-taxonomy/lib/recommended-taxonomy'

// Spec 073 US-01 — types Google dans la taxonomie.
describe('073 AC-01-01 — saisie', () => {
  it('liste séparée par des virgules, normalisée et dédoublonnée', () => {
    expect(parseGoogleTypesInput(' cafe, Coffee_Shop ,, *_restaurant cafe ')).toEqual(['cafe', 'coffee_shop', '*_restaurant'])
    expect(parseGoogleTypesInput('')).toEqual([])
    expect(formatGoogleTypesInput(['cafe', 'coffee_shop'])).toBe('cafe, coffee_shop')
  })
})

describe('073 AC-01-02 / BR-04 — types par défaut', () => {
  const bySlug = new Map(RECOMMENDED_TAXONOMY.map(category => [category.slug, category]))
  const migration = readFileSync(
    join(process.cwd(), 'prisma/migrations/20261006220000_acquisition_google_types/migration.sql'),
    'utf8',
  )

  it('taxonomie de référence', () => {
    expect(bySlug.get('diner')?.google_types).toEqual(['restaurant', '*_restaurant', 'bistro'])
    expect(bySlug.get('cafes')?.google_types).toContain('coffee_shop')
    expect(bySlug.get('urgences')?.google_types).toEqual(['pharmacy', 'doctor', 'hospital', 'veterinary_care'])
    expect(bySlug.get('rando')?.google_types ?? []).toEqual([])
    const shopping = bySlug.get('shopping')!
    expect(shopping.subcategories.find(sub => sub.slug === 'location-de-ski')?.google_types).toEqual(['sporting_goods_store'])
  })

  it('la migration ne remplace jamais des types déjà saisis', () => {
    const updates = migration.split('\n').filter(line => line.startsWith('UPDATE'))
    expect(updates.length).toBeGreaterThan(10)
    expect(updates.every(line => line.includes('cardinality("google_types") = 0'))).toBe(true)
    expect(migration).toContain(`WHERE "slug" = 'cafes'`)
  })
})
