import { filterPois } from '@/features/gemini-fetch/services/poi-filter'
import type { GeminiRawPoi } from '@/features/gemini-fetch/types'

const base: GeminiRawPoi = {
  name: 'Le Refuge',
  address: '12 rue du Mont Blanc, Saint-Gervais-les-Bains',
  phone: null,
  website: null,
  description: 'Un bon restau.',
  subcategory: null,
  hours: null,
  tags: [],
}

describe('filterPois — AC-02-01 closed establishments excluded', () => {
  it('excludes POI with name containing "fermé" or "closed"', () => {
    const pois: GeminiRawPoi[] = [
      base,
      { ...base, name: 'Café Fermé Définitivement' },
      { ...base, name: 'Old Closed Bar' },
    ]
    const result = filterPois(pois)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Le Refuge')
  })
})

describe('filterPois — AC-02-02 duplicates deduplicated', () => {
  it('removes POI with identical name + address', () => {
    const pois: GeminiRawPoi[] = [base, base, base]
    const result = filterPois(pois)
    expect(result).toHaveLength(1)
  })

  it('keeps POI with same name but different address', () => {
    const pois: GeminiRawPoi[] = [
      base,
      { ...base, address: '5 place du village, Saint-Gervais-les-Bains' },
    ]
    const result = filterPois(pois)
    expect(result).toHaveLength(2)
  })
})

describe('filterPois — AC-02-03 requires name + address', () => {
  it('excludes POI with empty name', () => {
    const pois: GeminiRawPoi[] = [base, { ...base, name: '' }]
    const result = filterPois(pois)
    expect(result).toHaveLength(1)
  })

  it('excludes POI with empty address', () => {
    const pois: GeminiRawPoi[] = [base, { ...base, address: '' }]
    const result = filterPois(pois)
    expect(result).toHaveLength(1)
  })
})

describe('filterPois — AC-02-04 geographic perimeter (trusts Gemini prompt)', () => {
  it('returns all valid POIs when none are filtered', () => {
    const pois: GeminiRawPoi[] = [
      base,
      { ...base, name: 'La Brasserie', address: '3 avenue de la Gare, Megève' },
    ]
    const result = filterPois(pois)
    expect(result).toHaveLength(2)
  })
})
