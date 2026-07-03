import { normalizeTrashBins } from '@/features/guide-customization/lib/validation'

describe('normalizeTrashBins', () => {
  it('keeps valid bins in order and trims descriptions', () => {
    expect(
      normalizeTrashBins([
        { type: 'jaune', description: '  Cartons, papiers  ' },
        { type: 'verte', description: 'Bouteilles en verre' },
      ]),
    ).toEqual([
      { type: 'jaune', description: 'Cartons, papiers' },
      { type: 'verte', description: 'Bouteilles en verre' },
    ])
  })

  it('drops bins with an unknown type', () => {
    expect(
      normalizeTrashBins([
        { type: 'rose', description: 'Inconnu' },
        { type: 'bleue', description: 'Papier' },
      ]),
    ).toEqual([{ type: 'bleue', description: 'Papier' }])
  })

  it('drops bins whose description is empty or whitespace', () => {
    expect(
      normalizeTrashBins([
        { type: 'jaune', description: '   ' },
        { type: 'verte', description: 'Verre' },
      ]),
    ).toEqual([{ type: 'verte', description: 'Verre' }])
  })

  it('dedupes by type, keeping the first occurrence', () => {
    expect(
      normalizeTrashBins([
        { type: 'jaune', description: 'Première' },
        { type: 'jaune', description: 'Doublon' },
      ]),
    ).toEqual([{ type: 'jaune', description: 'Première' }])
  })

  it('returns [] for undefined or empty input', () => {
    expect(normalizeTrashBins(undefined)).toEqual([])
    expect(normalizeTrashBins([])).toEqual([])
  })
})
