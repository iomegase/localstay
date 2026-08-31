/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { SubCategoryFilter } from '@/features/categories/components/SubCategoryFilter'
import type { SubCategoryWithCount } from '@/features/categories/types'

const push = jest.fn()
let searchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams,
  usePathname: () => '/guide/saint-gervais-les-bains/restaurants',
}))

const subcategories: SubCategoryWithCount[] = [
  { id: 'sub1', name: 'Gastronomique', slug: 'gastronomique', poi_count: 1 },
  { id: 'sub2', name: 'Snacking', slug: 'snacking', poi_count: 1 },
]

describe('SubCategoryFilter — AC-02-02', () => {
  beforeEach(() => {
    push.mockClear()
    searchParams = new URLSearchParams()
  })

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

  it('AC-03-01 / 003 AC-02-02: selects a subcategory through the private guide query contract', () => {
    searchParams = new URLSearchParams('sort=rating')
    render(<SubCategoryFilter subcategories={subcategories} />)

    fireEvent.click(screen.getByRole('button', { name: /Gastronomique/i }))

    expect(push).toHaveBeenCalledWith(
      '/guide/saint-gervais-les-bains/restaurants?sort=rating&sub=gastronomique',
    )
  })

  it('AC-03-02 / 003 AC-02-03: Tous removes only the active filter and restores the unfiltered private list', () => {
    searchParams = new URLSearchParams('sub=gastronomique&sort=rating')
    render(<SubCategoryFilter subcategories={subcategories} />)

    expect(screen.getByRole('button', { name: /Gastronomique/i })).toHaveClass('bg-charcoal')
    fireEvent.click(screen.getByRole('button', { name: /Tous/i }))

    expect(push).toHaveBeenCalledWith(
      '/guide/saint-gervais-les-bains/restaurants?sort=rating',
    )
  })

  it('does not leave an empty query delimiter when Tous clears the sole filter', () => {
    searchParams = new URLSearchParams('sub=gastronomique')
    render(<SubCategoryFilter subcategories={subcategories} />)

    fireEvent.click(screen.getByRole('button', { name: /Tous/i }))

    expect(push).toHaveBeenCalledWith('/guide/saint-gervais-les-bains/restaurants')
  })
})
