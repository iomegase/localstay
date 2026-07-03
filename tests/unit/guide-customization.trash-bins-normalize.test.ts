import { normalizeTrashBins } from '@/features/guide-customization/lib/validation'

describe('normalizeTrashBins', () => {
  it('keeps valid bin types in order (no description needed)', () => {
    expect(
      normalizeTrashBins([{ type: 'jaune' }, { type: 'verte' }]),
    ).toEqual([{ type: 'jaune' }, { type: 'verte' }])
  })

  it('drops bins with an unknown type', () => {
    expect(
      normalizeTrashBins([{ type: 'rose' }, { type: 'bleue' }]),
    ).toEqual([{ type: 'bleue' }])
  })

  it('dedupes by type, keeping the first occurrence', () => {
    expect(
      normalizeTrashBins([{ type: 'jaune' }, { type: 'jaune' }]),
    ).toEqual([{ type: 'jaune' }])
  })

  it('returns [] for undefined or empty input', () => {
    expect(normalizeTrashBins(undefined)).toEqual([])
    expect(normalizeTrashBins([])).toEqual([])
  })
})
