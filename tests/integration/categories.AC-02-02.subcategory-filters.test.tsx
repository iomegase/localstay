/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { SubCategoryFilter } from '@/features/categories/components/SubCategoryFilter'
import type { SubCategoryWithCount } from '@/features/categories/types'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/guide/saint-gervais-les-bains/restaurants',
}))

const subcategories: SubCategoryWithCount[] = [
  { id: 'sub1', name: 'Gastronomique', slug: 'gastronomique', poi_count: 1 },
  { id: 'sub2', name: 'Snacking', slug: 'snacking', poi_count: 1 },
]

describe('SubCategoryFilter — AC-02-02', () => {
  it('always renders a "Tous" chip', () => {
    render(<SubCategoryFilter subcategories={subcategories} />)
    expect(screen.getByText('Tous')).toBeInTheDocument()
  })

  it('renders one chip per subcategory', () => {
    render(<SubCategoryFilter subcategories={subcategories} />)
    expect(screen.getByText('Gastronomique')).toBeInTheDocument()
    expect(screen.getByText('Snacking')).toBeInTheDocument()
  })

  it('"Tous" chip has active styling (bg-gold) when no sub search param is set', () => {
    render(<SubCategoryFilter subcategories={subcategories} />)
    expect(screen.getByRole('button', { name: /Tous/i })).toHaveClass('bg-charcoal')
  })

  it('renders compact mobile pills', () => {
    render(<SubCategoryFilter subcategories={subcategories} />)

    expect(screen.getByRole('button', { name: /Tous/i })).toHaveClass('px-3')
    expect(screen.getByRole('button', { name: /Tous/i })).toHaveClass('py-1.5')
    expect(screen.getByTestId('subcategory-all-icon')).toHaveClass('h-5')
    expect(screen.getByTestId('subcategory-all-icon')).toHaveClass('w-5')
    expect(screen.getByTestId('subcategory-all-grid')).toHaveClass('h-2.5')
    expect(screen.getByTestId('subcategory-all-grid')).toHaveClass('w-2.5')

    const subcategory = screen.getByTestId('subcategory-gastronomique')
    expect(subcategory).toHaveClass('px-3')
    expect(subcategory).toHaveClass('py-1.5')
    expect(subcategory.querySelector('[data-testid="subcategory-count-gastronomique"]')).toHaveClass('h-5')
    expect(subcategory.querySelector('[data-testid="subcategory-count-gastronomique"]')).toHaveClass('w-5')
  })
})
