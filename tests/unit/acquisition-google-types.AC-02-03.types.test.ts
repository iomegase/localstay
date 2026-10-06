import { classifyTypeMatch, googleTypeLabel, matchesGoogleType, planTypeQueries } from '@/features/poi-acquisition/lib/google-types'

// Spec 073 — logique des types Google.
describe('073 — correspondance de type', () => {
  it('type exact ou motif *_suffixe', () => {
    expect(matchesGoogleType('cafe', ['cafe', 'coffee_shop'])).toBe(true)
    expect(matchesGoogleType('french_restaurant', ['restaurant', '*_restaurant'])).toBe(true)
    expect(matchesGoogleType('restaurant', ['*_restaurant'])).toBe(false)
    expect(matchesGoogleType('bar', ['cafe'])).toBe(false)
  })

  it('AC-03-01 : primary / secondary / unknown', () => {
    const accepted = ['cafe', 'coffee_shop', 'tea_house']
    expect(classifyTypeMatch('cafe', ['cafe', 'food'], accepted)).toBe('primary')
    expect(classifyTypeMatch('french_restaurant', ['french_restaurant', 'cafe'], accepted)).toBe('secondary')
    expect(classifyTypeMatch(null, [], accepted)).toBe('unknown')
    expect(classifyTypeMatch('bar', ['bar'], accepted)).toBe('secondary')
  })

  it('sans types configurés : tout est primaire (pas de tri)', () => {
    expect(classifyTypeMatch('bar', ['bar'], [])).toBe('primary')
  })
})

describe('073 AC-02-01 / AC-02-02 — plan de requêtes par type', () => {
  it('une requête par type exact distinct, rattachée à sa sous-catégorie si elle est unique', () => {
    const plan = planTypeQueries({
      categoryTypes: ['cafe', 'coffee_shop', 'tea_house', 'bakery', 'breakfast_restaurant'],
      subcategories: [
        { name: 'Petit-déjeuner', types: ['breakfast_restaurant', 'bakery'] },
        { name: 'Café', types: ['cafe', 'coffee_shop'] },
        { name: 'Salon de thé', types: ['tea_house', 'bakery'] },
      ],
    })
    expect(plan).toEqual([
      { includedType: 'cafe', query_subcategory_name: 'Café' },
      { includedType: 'coffee_shop', query_subcategory_name: 'Café' },
      { includedType: 'tea_house', query_subcategory_name: 'Salon de thé' },
      { includedType: 'bakery', query_subcategory_name: null },
      { includedType: 'breakfast_restaurant', query_subcategory_name: 'Petit-déjeuner' },
    ])
  })

  it('BR-02 : les motifs *_suffixe ne sont jamais envoyés à Google', () => {
    const plan = planTypeQueries({ categoryTypes: ['restaurant', '*_restaurant', 'bistro'], subcategories: [] })
    expect(plan.map(query => query.includedType)).toEqual(['restaurant', 'bistro'])
  })

  it('AC-02-03 : aucun type exact → plan vide (repli texte)', () => {
    expect(planTypeQueries({ categoryTypes: [], subcategories: [{ name: 'Facile', types: [] }] })).toEqual([])
  })
})

describe('073 AC-03-03 — libellés', () => {
  it('traduit les types courants, sinon type brut lisible', () => {
    expect(googleTypeLabel('french_restaurant')).toBe('Restaurant français')
    expect(googleTypeLabel('cafe')).toBe('Café')
    expect(googleTypeLabel('some_new_type')).toBe('some new type')
    expect(googleTypeLabel(null)).toBe('Type inconnu')
  })
})
