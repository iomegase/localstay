import { normalizePracticalBlocks } from '@/features/guide-customization/lib/validation'

describe('normalizePracticalBlocks — video_url', () => {
  it('keeps a non-empty video_url and nulls an empty one', () => {
    const result = normalizePracticalBlocks([
      { title: 'Visite', body: null, icon: 'star', photo_url: null, video_url: '  https://youtu.be/dQw4w9WgXcQ  ', sort_order: 0 },
      { title: 'Sans vidéo', body: null, icon: 'info', photo_url: null, video_url: '   ', sort_order: 1 },
    ])

    expect(result).toEqual([
      { title: 'Visite', body: null, icon: 'star', photo_url: null, video_url: 'https://youtu.be/dQw4w9WgXcQ', sort_order: 0 },
      { title: 'Sans vidéo', body: null, icon: 'info', photo_url: null, video_url: null, sort_order: 1 },
    ])
  })
})
