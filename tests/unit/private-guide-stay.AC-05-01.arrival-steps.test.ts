import { parseArrivalFacts, parseArrivalSubsteps, ARRIVAL_STEP_KINDS } from '@/features/guide-app/lib/arrival-steps'
import { normalizeArrivalInstructions } from '@/features/guide-customization/lib/validation'

describe('054 AC-05-01 — typed arrival steps', () => {
  it('exposes the five step kinds', () => {
    expect(ARRIVAL_STEP_KINDS).toEqual(['address', 'access', 'garage', 'ski', 'custom'])
  })

  it('parses stored substeps and facts, ignoring malformed entries', () => {
    expect(parseArrivalSubsteps([{ title: 'Garez-vous', detail: 'Niveau −2' }, { nope: 1 }, 'x'])).toEqual([
      { title: 'Garez-vous', detail: 'Niveau −2' },
    ])
    expect(parseArrivalSubsteps(null)).toEqual([])
    expect(parseArrivalFacts([{ label: 'Places', value: '46 · 47' }, { label: '', value: 'x' }])).toEqual([
      { label: 'Places', value: '46 · 47' },
    ])
    expect(parseArrivalFacts({})).toEqual([])
  })

  it('normalizes kind, tip, substeps and facts before persistence', () => {
    expect(
      normalizeArrivalInstructions([
        {
          title: ' Garage ',
          text: 'Deux places couvertes.',
          video_url: null,
          photos: [],
          sort_order: 3,
          kind: 'garage',
          tip: '  Hauteur 1,90 m  ',
          substeps: [{ title: ' Rampe ', detail: ' À l’arrière ' }, { title: '  ', detail: '' }],
          facts: [{ label: ' Niveau ', value: ' −2 ' }, { label: 'Vide', value: '  ' }],
        },
      ]),
    ).toEqual([
      {
        title: 'Garage',
        text: 'Deux places couvertes.',
        video_url: null,
        photos: [],
        sort_order: 0,
        kind: 'garage',
        tip: 'Hauteur 1,90 m',
        substeps: [{ title: 'Rampe', detail: 'À l’arrière' }],
        facts: [{ label: 'Niveau', value: '−2' }],
      },
    ])
  })

  it('defaults legacy instructions to the custom kind with no extras', () => {
    const [step] = normalizeArrivalInstructions([
      { title: null, text: 'Entrez', video_url: null, photos: [], sort_order: 0 },
    ])
    expect(step).toMatchObject({ kind: 'custom', tip: null, substeps: [], facts: [] })
  })
})
