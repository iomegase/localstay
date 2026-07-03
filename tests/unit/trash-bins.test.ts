import { TRASH_BIN_TYPES, TRASH_BINS, getTrashBin } from '@/features/guide-customization/lib/trash-bins'

describe('trash-bins catalogue', () => {
  it('exposes the five French preset bins in order', () => {
    expect(TRASH_BIN_TYPES).toEqual(['jaune', 'verte', 'bordeaux', 'marron', 'bleue'])
  })

  it('gives each bin a label and an icon color class', () => {
    for (const bin of TRASH_BINS) {
      expect(bin.label.length).toBeGreaterThan(0)
      expect(bin.colorClass).toMatch(/^text-/)
    }
  })

  it('getTrashBin resolves a known type and returns undefined otherwise', () => {
    expect(getTrashBin('jaune')?.label).toBe('Poubelle jaune')
    expect(getTrashBin('unknown')).toBeUndefined()
  })
})
