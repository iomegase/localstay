/** @jest-environment jsdom */

import { render, screen, within } from '@testing-library/react'
import { LodgingFeatureSections } from '@/features/lodging-showcase/components/LodgingFeatureSections'

const included = ['Wi-Fi', 'Parking', 'Cuisine équipée', 'Lave-vaisselle', 'Sauna']
const onRequest = ['Chef privé', 'Petit-déjeuner', 'Ménage']

function cards() {
  const section = screen.getByTestId('lodging-feature-sections')
  return { section, articles: within(section).getAllByRole('article') }
}

describe('028 AC-02-10 — Équipements and Services sur demande layout', () => {
  it('stacks the two blocks on full-width rows, each list in 2 columns from sm and 3 from lg (086 AC-03)', () => {
    render(<LodgingFeatureSections includedAmenities={included} onRequestAmenities={onRequest} />)
    const { section, articles } = cards()

    expect(section).not.toHaveClass('md:grid-cols-2')
    expect(articles.map(article => article.textContent)).toEqual([
      expect.stringMatching(/^Équipements/),
      expect.stringMatching(/^Services sur demande/),
    ])
    for (const article of articles) {
      expect(article).not.toHaveClass('md:min-h-[320px]')
      expect(within(article).getByRole('list')).toHaveClass('grid', 'sm:grid-cols-2', 'lg:grid-cols-3')
    }
    expect(within(articles[0]).getAllByRole('listitem')).toHaveLength(5)
  })

  it('keeps a single column in compact (demo modal) mode', () => {
    render(<LodgingFeatureSections includedAmenities={included} onRequestAmenities={onRequest} compact />)
    const { articles } = cards()

    for (const article of articles) {
      expect(within(article).getByRole('list')).not.toHaveClass('sm:grid-cols-2')
    }
  })
})
