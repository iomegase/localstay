/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { CategoryRow } from '@/features/city-guide/components/CategoryRow'
import type { CategorySummary } from '@/features/city-guide/types'

const categories: CategorySummary[] = [
  { id: '1', name: 'Restaurants', slug: 'restaurants', icon: 'utensils', sort_order: 1, poi_count: 5 },
  { id: '2', name: 'Randonnées', slug: 'randonnees', icon: 'mountain', sort_order: 2, poi_count: 3 },
]

describe('CategoryRow (AC-03-01, AC-03-02)', () => {
  it('AC-03-01: renders null when categories array is empty', () => {
    const { container } = render(
      <CategoryRow categories={[]} citySlug="testville" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('AC-03-01: renders all categories passed as props', () => {
    render(<CategoryRow categories={categories} citySlug="saint-gervais-les-bains" />)
    expect(screen.getByText('Restaurants')).toBeInTheDocument()
    expect(screen.getByText('Randonnées')).toBeInTheDocument()
  })

  it('AC-03-02: each category shows its poi_count badge', () => {
    render(<CategoryRow categories={categories} citySlug="saint-gervais-les-bains" />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('AC-03-02: each category links to /guide/[citySlug]/[categorySlug]', () => {
    render(<CategoryRow categories={categories} citySlug="saint-gervais-les-bains" />)
    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', '/guide/saint-gervais-les-bains')
    expect(links[1]).toHaveAttribute('href', '/guide/saint-gervais-les-bains/restaurants')
    expect(links[2]).toHaveAttribute('href', '/guide/saint-gervais-les-bains/randonnees')
  })

  it('marks the active category with aria-current when activeCategorySlug matches', () => {
    render(
      <CategoryRow
        categories={categories}
        citySlug="saint-gervais-les-bains"
        activeCategorySlug="randonnees"
      />
    )
    const activeLink = screen.getByText('Randonnées').closest('a')
    expect(activeLink).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('Restaurants').closest('a')).not.toHaveAttribute('aria-current')
    // "Tous" is not the active category here
    expect(screen.getByText('Tous').closest('a')).not.toHaveAttribute('aria-current')
  })

  it('marks no category as active when activeCategorySlug is omitted (city page unchanged)', () => {
    render(<CategoryRow categories={categories} citySlug="saint-gervais-les-bains" />)
    screen.getAllByRole('link').forEach(link => {
      expect(link).not.toHaveAttribute('aria-current')
    })
  })

  it('012: preserves lodging query in category links when provided', () => {
    render(
      <CategoryRow
        categories={categories}
        citySlug="saint-gervais-les-bains"
        lodgingId="lodging-1"
      />
    )
    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', '/guide/saint-gervais-les-bains?lodging=lodging-1')
    expect(links[1]).toHaveAttribute('href', '/guide/saint-gervais-les-bains/restaurants?lodging=lodging-1')
    expect(links[2]).toHaveAttribute('href', '/guide/saint-gervais-les-bains/randonnees?lodging=lodging-1')
  })
})
