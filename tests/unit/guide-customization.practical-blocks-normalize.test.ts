import { normalizePracticalBlocks } from '@/features/guide-customization/lib/validation'

describe('normalizePracticalBlocks', () => {
  it('trims titles, nulls empty body/photo, drops untitled blocks, reindexes sort_order', () => {
    const result = normalizePracticalBlocks([
      { title: '  Plage  ', body: 'À 5 min', icon: 'star', photo_url: '', sort_order: 9 },
      { title: '   ', body: 'orphan', icon: 'info', photo_url: null, sort_order: 3 },
      { title: 'Vélos', body: '   ', icon: 'bike', photo_url: 'https://x/y.webp', sort_order: 1 },
    ])

    expect(result).toEqual([
      { title: 'Plage', body: 'À 5 min', icon: 'star', photo_url: null, sort_order: 0 },
      { title: 'Vélos', body: null, icon: 'bike', photo_url: 'https://x/y.webp', sort_order: 1 },
    ])
  })

  it('returns [] for undefined or empty input', () => {
    expect(normalizePracticalBlocks(undefined)).toEqual([])
    expect(normalizePracticalBlocks([])).toEqual([])
  })
})
