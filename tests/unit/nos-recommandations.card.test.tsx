/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { RecommendationCard } from '@/app/(public)/nos-recommandations/_components/RecommendationCard'
import type { RecRow } from '@/app/(public)/nos-recommandations/_components/variants'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

function makeRow(over: Partial<RecRow['poi']> = {}, note: string | null = null): RecRow {
  return {
    poi_id: 'p1',
    owner_note: note,
    poi: {
      id: 'p1',
      name: 'Bistrot du Centre',
      slug: 'bistrot-du-centre',
      description: 'Cuisine locale.',
      photos: ['https://cdn.test/x.jpg'],
      category: { name: 'Restaurants', slug: 'restaurants' },
      city: null,
      ...over,
    },
  }
}

describe('RecommendationCard', () => {
  it('links to the POI using the fallback city slug when poi.city is missing', () => {
    render(<RecommendationCard row={makeRow()} variant="bigImage" fallbackCitySlug="saint-gervais" />)
    expect(screen.getByRole('link', { name: /Bistrot du Centre/i })).toHaveAttribute(
      'href',
      '/guide/saint-gervais/restaurants/bistrot-du-centre',
    )
  })

  it('uses poi.city.slug when present', () => {
    render(
      <RecommendationCard
        row={makeRow({ city: { slug: 'annecy', name: 'Annecy' } })}
        variant="white"
        fallbackCitySlug="saint-gervais"
      />,
    )
    expect(screen.getByRole('link', { name: /Bistrot du Centre/i })).toHaveAttribute(
      'href',
      '/guide/annecy/restaurants/bistrot-du-centre',
    )
  })

  it('renders the owner note with its test id when present', () => {
    render(<RecommendationCard row={makeRow({}, 'Notre coup de cœur.')} variant="bigImage" fallbackCitySlug="x" />)
    expect(screen.getByTestId('owner-recommendation-comment')).toHaveTextContent('Notre coup de cœur.')
  })

  it('does not render the owner note element when absent', () => {
    render(<RecommendationCard row={makeRow()} variant="white" fallbackCitySlug="x" />)
    expect(screen.queryByTestId('owner-recommendation-comment')).not.toBeInTheDocument()
  })

  it('shows the category label by default', () => {
    render(<RecommendationCard row={makeRow()} variant="white" fallbackCitySlug="x" />)
    expect(screen.getByText('Restaurants')).toBeInTheDocument()
  })

  it('hides the category label when showCategory is false', () => {
    render(<RecommendationCard row={makeRow()} variant="white" fallbackCitySlug="x" showCategory={false} />)
    expect(screen.queryByText('Restaurants')).not.toBeInTheDocument()
  })
})
