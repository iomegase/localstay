import { normalizeArrivalInstructions } from '@/features/guide-customization/lib/validation'

describe('normalizeArrivalInstructions', () => {
  it('drops instructions without text, trims, cleans photos and reindexes order', () => {
    expect(
      normalizeArrivalInstructions([
        { text: '   ', video_url: null, photos: [], sort_order: 0 },
        {
          text: '  Ouvrez le portail avec le badge  ',
          video_url: '  https://youtu.be/abc  ',
          photos: ['  a.jpg ', '', 'b.jpg'],
          sort_order: 9,
        },
      ]),
    ).toEqual([
      {
        text: 'Ouvrez le portail avec le badge',
        video_url: 'https://youtu.be/abc',
        photos: ['a.jpg', 'b.jpg'],
        sort_order: 0,
      },
    ])
  })

  it('returns [] for empty or undefined input', () => {
    expect(normalizeArrivalInstructions(undefined)).toEqual([])
    expect(normalizeArrivalInstructions([])).toEqual([])
  })
})
