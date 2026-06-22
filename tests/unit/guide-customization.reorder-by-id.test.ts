import { reorderById } from '@/features/guide-customization/lib/validation'

describe('reorderById', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

  it('moves the active item to the position of the over item', () => {
    expect(reorderById(items, 'a', 'c')).toEqual([{ id: 'b' }, { id: 'c' }, { id: 'a' }])
    expect(reorderById(items, 'c', 'a')).toEqual([{ id: 'c' }, { id: 'a' }, { id: 'b' }])
  })

  it('returns the same array when ids are equal or unknown', () => {
    expect(reorderById(items, 'a', 'a')).toBe(items)
    expect(reorderById(items, 'a', 'zzz')).toBe(items)
  })
})
