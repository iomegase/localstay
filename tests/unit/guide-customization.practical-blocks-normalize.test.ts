import { normalizePracticalBlocks } from '@/features/guide-customization/lib/validation'

describe('normalizePracticalBlocks', () => {
  it('trims titles, nulls empty body/photo, drops untitled blocks, reindexes sort_order', () => {
    const result = normalizePracticalBlocks([
      { id: 'block-1', title: '  Plage  ', body: 'À 5 min', icon: 'star', photo_url: '', video_url: null, sort_order: 9 },
      { title: '   ', body: 'orphan', icon: 'info', photo_url: null, video_url: null, sort_order: 3 },
      { id: 'tmp-new-block', title: 'Vélos', body: '   ', icon: 'bike', photo_url: 'https://x/y.webp', video_url: null, sort_order: 1 },
    ])

    expect(result).toEqual([
      { id: 'block-1', title: 'Plage', body: 'À 5 min', icon: 'star', photo_url: null, video_url: null, sort_order: 0 },
      { title: 'Vélos', body: null, icon: 'bike', photo_url: 'https://x/y.webp', video_url: null, sort_order: 1 },
    ])
  })

  it('returns [] for undefined or empty input', () => {
    expect(normalizePracticalBlocks(undefined)).toEqual([])
    expect(normalizePracticalBlocks([])).toEqual([])
  })
})
