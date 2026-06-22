/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { CategoryBentoGrid } from '@/features/city-guide/components/CategoryBentoGrid'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

const CATEGORIES = [
  { id: '1', name: 'Boulangerie', slug: 'boulangerie', icon: 'coffee', sort_order: 0, poi_count: 4 },
  { id: '2', name: 'Rando', slug: 'rando', icon: 'mountain', sort_order: 1, poi_count: 3 },
  { id: '3', name: 'Dîner', slug: 'diner', icon: 'utensils', sort_order: 2, poi_count: 5 },
]

describe('CategoryBentoGrid', () => {
  it('renders one card per category', () => {
    render(<CategoryBentoGrid categories={CATEGORIES} citySlug="saint-gervais-les-bains" />)
    expect(screen.getByText('Boulangerie')).toBeInTheDocument()
    expect(screen.getByText('Dîner')).toBeInTheDocument()
  })

  it('links each card to its guide category route', () => {
    render(<CategoryBentoGrid categories={CATEGORIES} citySlug="saint-gervais-les-bains" />)
    expect(screen.getByText('Boulangerie').closest('a')).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains/boulangerie',
    )
  })

  it('inserts the Nos favoris card after the rando category', () => {
    render(<CategoryBentoGrid categories={CATEGORIES} citySlug="saint-gervais-les-bains" />)
    expect(screen.getByText('Nos favoris')).toBeInTheDocument()
  })

  it('propagates the lodging id into category links', () => {
    render(
      <CategoryBentoGrid
        categories={CATEGORIES}
        citySlug="saint-gervais-les-bains"
        lodgingId="lodge-1"
      />,
    )
    expect(screen.getByText('Boulangerie').closest('a')).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains/boulangerie?lodging=lodge-1',
    )
  })
})
