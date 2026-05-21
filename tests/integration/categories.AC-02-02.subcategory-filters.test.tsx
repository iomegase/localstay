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
    expect(screen.getByText('Tous')).toHaveClass('bg-gold')
  })
})
