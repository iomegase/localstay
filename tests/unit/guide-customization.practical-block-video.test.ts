import { normalizePracticalBlocks } from '@/features/guide-customization/lib/validation'

describe('normalizePracticalBlocks — video_url', () => {
  it('spec 096 AC-03-02 : la vidéo envoyée par l’Owner est ignorée (gérée par la bibliothèque)', () => {
    const result = normalizePracticalBlocks([
      { title: 'Visite', body: null, icon: 'star', photo_url: null, video_url: '  https://youtu.be/dQw4w9WgXcQ  ', sort_order: 0 },
    ])

    expect(result).toEqual([{ equipment_template_id: null, title: 'Visite', body: null, sort_order: 0 }])
  })
})
