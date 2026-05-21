/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { CategoryGrid } from '@/features/categories/components/CategoryGrid'
import type { CategorySummary } from '@/features/city-guide/types'

const catWithPois: CategorySummary = {
  id: '1', name: 'Restaurants', slug: 'restaurants', icon: 'utensils', sort_order: 1, poi_count: 3,
}

describe('CategoryGrid — AC-01-01, AC-01-02', () => {
  it('AC-01-02: returns null (nothing in DOM) when categories array is empty', () => {
    const { container } = render(<CategoryGrid categories={[]} citySlug="test-city" />)
    expect(container.firstChild).toBeNull()
  })

  it('AC-01-01: renders a category that was passed in', () => {
    render(<CategoryGrid categories={[catWithPois]} citySlug="test-city" />)
    expect(screen.getByText('Restaurants')).toBeInTheDocument()
  })

  it('AC-01-01: does not render a category that was not passed in', () => {
    render(<CategoryGrid categories={[catWithPois]} citySlug="test-city" />)
    expect(screen.queryByText('Sport')).not.toBeInTheDocument()
  })

  it('each category links to /guide/[citySlug]/[catSlug]', () => {
    render(<CategoryGrid categories={[catWithPois]} citySlug="saint-gervais-les-bains" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/guide/saint-gervais-les-bains/restaurants')
  })
})
