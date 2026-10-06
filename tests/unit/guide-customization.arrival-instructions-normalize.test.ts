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
        kind: 'custom',
        tip: null,
        substeps: [],
        facts: [],
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
        kind: 'custom',
        tip: null,
        substeps: [],
        facts: [],
      },
    ])
  })

  it('returns [] for empty or undefined input', () => {
    expect(normalizeArrivalInstructions(undefined)).toEqual([])
    expect(normalizeArrivalInstructions([])).toEqual([])
  })
})

describe('083 AC-01-04 — texte d’étape facultatif', () => {
  it('garde une étape avec un titre ou des photos sans texte (texte vide), retire une étape vide', () => {
    const { normalizeArrivalInstructions } = jest.requireActual<typeof import('@/features/guide-customization/lib/validation')>('@/features/guide-customization/lib/validation')
    const result = normalizeArrivalInstructions([
      { title: 'Le portail', text: '', video_url: null, photos: [], sort_order: 0 },
      { title: null, text: ' ', video_url: null, photos: ['https://cdn.test/p.webp'], sort_order: 1 },
      { title: ' ', text: ' ', video_url: null, photos: [], sort_order: 2 },
    ] as never)
    expect(result.map(step => [step.title, step.text, step.photos.length])).toEqual([
      ['Le portail', '', 0],
      [null, '', 1],
    ])
  })
})
