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
  it('stacks the two blocks on full-width rows, each list in 2 columns from mobile and 3 from lg on white cards (086 AC-03)', () => {
    render(<LodgingFeatureSections includedAmenities={included} onRequestAmenities={onRequest} />)
    const { section, articles } = cards()

    expect(section).not.toHaveClass('md:grid-cols-2')
    expect(articles.map(article => article.textContent)).toEqual([
      expect.stringMatching(/^Équipements/),
      expect.stringMatching(/^Services sur demande/),
    ])
    for (const article of articles) {
      expect(article).not.toHaveClass('md:min-h-[320px]')
      expect(article).toHaveClass('bg-white')
      expect(article).not.toHaveClass('bg-[#f8f7f5]')
      expect(within(article).getByRole('list')).toHaveClass('grid', 'grid-cols-2')
      for (const item of within(article).getAllByRole('listitem')) {
        expect(item).toHaveClass('bg-white', 'shadow-md')
        // AC-02-13 : icônes en slate-800.
        expect(item.querySelector('svg')).toHaveClass('text-slate-800')
      }
    }
    expect(within(articles[0]).getAllByRole('listitem')).toHaveLength(5)
  })

  it('AC-02-11: splits 4 columns from lg, 3 for amenities and 1 for on-request services', () => {
    render(<LodgingFeatureSections includedAmenities={included} onRequestAmenities={onRequest} />)
    const { section, articles } = cards()

    expect(section).toHaveClass('lg:grid-cols-4')
    expect(articles[0]).toHaveClass('lg:col-span-3')
    expect(within(articles[0]).getByRole('list')).toHaveClass('grid-cols-2', 'lg:grid-cols-3')
    expect(articles[1]).not.toHaveClass('lg:col-span-3')
    expect(within(articles[1]).getByRole('list')).toHaveClass('grid-cols-2', 'lg:grid-cols-1')
  })

  it('AC-02-11: keeps a full-width block when the other one is empty', () => {
    render(<LodgingFeatureSections includedAmenities={included} onRequestAmenities={[]} />)
    const { section, articles } = cards()

    expect(section).not.toHaveClass('lg:grid-cols-4')
    expect(articles).toHaveLength(1)
    expect(articles[0]).not.toHaveClass('lg:col-span-3')
    expect(within(articles[0]).getByRole('list')).toHaveClass('grid-cols-2', 'lg:grid-cols-3')
  })

  it('keeps a single column in compact (demo modal) mode', () => {
    render(<LodgingFeatureSections includedAmenities={included} onRequestAmenities={onRequest} compact />)
    const { articles } = cards()

    for (const article of articles) {
      expect(within(article).getByRole('list')).not.toHaveClass('grid-cols-2')
    }
  })
})
