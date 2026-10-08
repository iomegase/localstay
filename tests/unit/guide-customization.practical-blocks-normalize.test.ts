import { normalizePracticalBlocks } from '@/features/guide-customization/lib/validation'

describe('normalizePracticalBlocks', () => {
  it('trims titles, nulls empty body, drops untitled blocks, reindexes sort_order ; ignore icon/photo/vidéo (spec 096)', () => {
    const result = normalizePracticalBlocks([
      { id: 'block-1', title: '  Plage  ', body: 'À 5 min', icon: 'star', photo_url: '', video_url: null, sort_order: 9 },
      { title: '   ', body: 'orphan', icon: 'info', photo_url: null, video_url: null, sort_order: 3 },
      { id: 'tmp-new-block', equipment_template_id: ' t-1 ', title: 'Vélos', body: '   ', icon: 'bike', photo_url: 'https://x/y.webp', video_url: null, sort_order: 1 },
    ])

    expect(result).toEqual([
      { id: 'block-1', equipment_template_id: null, title: 'Plage', body: 'À 5 min', sort_order: 0 },
      { equipment_template_id: 't-1', title: 'Vélos', body: null, sort_order: 1 },
    ])
  })

  it('returns [] for undefined or empty input', () => {
    expect(normalizePracticalBlocks(undefined)).toEqual([])
    expect(normalizePracticalBlocks([])).toEqual([])
  })
})
