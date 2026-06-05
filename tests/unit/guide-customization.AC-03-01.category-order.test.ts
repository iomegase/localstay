/**
 * AC-03-01 — Ordre catégories sauvegardé et appliqué
 */

import { applyCustomizationToCategorySummaries } from '@/features/guide-customization/queries/customization'
import type { CategorySummary } from '@/features/city-guide/types'

const categories: CategorySummary[] = [
  { id: 'cat-1', name: 'Restaurants', slug: 'restaurants', icon: 'utensils', sort_order: 1, poi_count: 4 },
  { id: 'cat-2', name: 'Randonnees', slug: 'randonnees', icon: 'mountain', sort_order: 2, poi_count: 3 },
  { id: 'cat-3', name: 'Musees', slug: 'musees', icon: 'landmark', sort_order: 3, poi_count: 2 },
]

describe('012 category order customization', () => {
  it('AC-03-01: applies owner category order before default ordered categories', () => {
    const result = applyCustomizationToCategorySummaries(categories, ['musees', 'restaurants'])

    expect(result.map(category => category.slug)).toEqual(['musees', 'restaurants', 'randonnees'])
  })

  it('BR-12: keeps the full city category list even when featured POIs exist', () => {
    const result = applyCustomizationToCategorySummaries(
      categories,
      ['musees', 'restaurants'],
      [
        { poi_id: 'poi-1', sort_order: 0, category_slug: 'restaurants' },
        { poi_id: 'poi-2', sort_order: 1, category_slug: 'restaurants' },
        { poi_id: 'poi-3', sort_order: 2, category_slug: 'musees' },
      ],
    )

    expect(result.map(category => [category.slug, category.poi_count])).toEqual([
      ['musees', 2],
      ['restaurants', 4],
      ['randonnees', 3],
    ])
  })
})
