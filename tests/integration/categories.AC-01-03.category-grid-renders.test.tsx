/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { CategoryGrid } from '@/features/categories/components/CategoryGrid'
import type { CategorySummary } from '@/features/city-guide/types'

const categories: CategorySummary[] = [
  { id: '1', name: 'Restaurants', slug: 'restaurants', icon: 'utensils', sort_order: 1, poi_count: 5 },
  { id: '2', name: 'Randonnées', slug: 'randonnees', icon: 'mountain', sort_order: 2, poi_count: 12 },
]

describe('CategoryGrid — AC-01-03', () => {
  it('renders the name of each category', () => {
    render(<CategoryGrid categories={categories} citySlug="saint-gervais-les-bains" />)
    expect(screen.getByText('Restaurants')).toBeInTheDocument()
    expect(screen.getByText('Randonnées')).toBeInTheDocument()
  })

  it('renders the poi_count badge for each category (shows 9+ when > 9)', () => {
    render(<CategoryGrid categories={categories} citySlug="saint-gervais-les-bains" />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('9+')).toBeInTheDocument()
  })

  it('renders a link to the category page for each item', () => {
    render(<CategoryGrid categories={categories} citySlug="saint-gervais-les-bains" />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('href', '/guide/saint-gervais-les-bains/restaurants')
    expect(links[1]).toHaveAttribute('href', '/guide/saint-gervais-les-bains/randonnees')
  })
})
