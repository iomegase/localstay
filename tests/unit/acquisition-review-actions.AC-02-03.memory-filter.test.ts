import { filterByReviewMemory, memoryStatusFor } from '@/features/poi-acquisition/lib/review-memory'

// Spec 071 — filtrage des candidats par la mémoire de revue.
const memories = [
  { google_place_id: 'rejete-diner', kind: 'rejected', category_id: 'cat-diner', category_name: 'Restaurant' },
  { google_place_id: 'exclu', kind: 'excluded', category_id: null, category_name: null },
  { google_place_id: 'rejete-et-exclu', kind: 'rejected', category_id: 'cat-diner', category_name: 'Restaurant' },
  { google_place_id: 'rejete-et-exclu', kind: 'excluded', category_id: null, category_name: null },
]

function candidate(id: string | null) {
  return { google_place_id: id }
}

describe('071 — filterByReviewMemory', () => {
  it('AC-02-02 / AC-03-02 : écarte les rejetés de la catégorie et les exclus', () => {
    const result = filterByReviewMemory(
      [candidate('nouveau'), candidate('rejete-diner'), candidate('exclu'), candidate(null)],
      memories,
      'cat-diner',
    )
    expect(result.kept.map(item => item.google_place_id)).toEqual(['nouveau', null])
    expect(result).toMatchObject({ skippedRejected: 1, skippedExcluded: 1 })
  })

  it('AC-02-03 : un rejet ne vaut que pour sa catégorie', () => {
    const result = filterByReviewMemory([candidate('rejete-diner')], memories, 'cat-shop')
    expect(result.kept).toHaveLength(1)
    expect(result).toMatchObject({ skippedRejected: 0, skippedExcluded: 0 })
  })

  it('BR-02 : une exclusion prime sur un rejet', () => {
    const result = filterByReviewMemory([candidate('rejete-et-exclu')], memories, 'cat-diner')
    expect(result).toMatchObject({ skippedRejected: 0, skippedExcluded: 1 })
  })

  it('BR-01 : sans google_place_id, pas de mémoire', () => {
    expect(filterByReviewMemory([candidate(null)], memories, 'cat-diner').kept).toHaveLength(1)
  })
})

describe('071 AC-04-02 — memoryStatusFor (badges de la recherche par nom)', () => {
  it('exclusion, rejet (avec les catégories), ou rien', () => {
    expect(memoryStatusFor('exclu', memories)).toEqual({ kind: 'excluded', categories: [] })
    expect(memoryStatusFor('rejete-diner', memories)).toEqual({ kind: 'rejected', categories: ['Restaurant'] })
    expect(memoryStatusFor('rejete-et-exclu', memories)).toEqual({ kind: 'excluded', categories: [] })
    expect(memoryStatusFor('inconnu', memories)).toBeNull()
  })
})
