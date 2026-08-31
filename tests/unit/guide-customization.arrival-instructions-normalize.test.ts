import { normalizeArrivalInstructions } from '@/features/guide-customization/lib/validation'

describe('normalizeArrivalInstructions', () => {
  it('drops instructions without text, trims title, cleans photos and reindexes order', () => {
    expect(
      normalizeArrivalInstructions([
        { title: '   ', text: '   ', video_url: null, photos: [], sort_order: 0 },
        {
          id: 'instruction-1',
          title: '  Bienvenue à la Pieuca  ',
          text: '  Ouvrez le portail avec le badge  ',
          video_url: '  https://youtu.be/abc  ',
          photos: ['  a.jpg ', '', 'b.jpg'],
          sort_order: 9,
        },
      ]),
    ).toEqual([
      {
        id: 'instruction-1',
        title: 'Bienvenue à la Pieuca',
        text: 'Ouvrez le portail avec le badge',
        video_url: 'https://youtu.be/abc',
        photos: ['a.jpg', 'b.jpg'],
        sort_order: 0,
      },
    ])
  })

  it('drops temporary UI ids before persistence', () => {
    expect(
      normalizeArrivalInstructions([
        {
          id: 'tmp-new-instruction',
          title: null,
          text: 'Entrez dans le logement',
          video_url: null,
          photos: [],
          sort_order: 0,
        },
      ]),
    ).toEqual([
      {
        title: null,
        text: 'Entrez dans le logement',
        video_url: null,
        photos: [],
        sort_order: 0,
      },
    ])
  })

  it('returns [] for empty or undefined input', () => {
    expect(normalizeArrivalInstructions(undefined)).toEqual([])
    expect(normalizeArrivalInstructions([])).toEqual([])
  })
})
