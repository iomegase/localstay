/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { BentoSection } from '@/app/(public)/nos-recommandations/_components/BentoSection'
import type { RecRow } from '@/app/(public)/nos-recommandations/_components/variants'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

function row(id: string, name: string): RecRow {
  return {
    poi_id: id,
    owner_note: null,
    poi: {
      id, name, slug: id, description: null, photos: [],
      category: { name: 'Restaurants', slug: 'restaurants' },
      city: null,
    },
  }
}

describe('BentoSection', () => {
  it('renders a semibold category title and a card per row', () => {
    render(
      <BentoSection
        eyebrow="Sélection principale"
        title="Restaurants"
        rows={[row('a', 'Chez A'), row('b', 'Chez B')]}
        fallbackCitySlug="sg"
        showCardCategory={false}
      />,
    )
    const title = screen.getByRole('heading', { level: 2, name: 'Restaurants' })
    expect(title).toHaveClass('font-semibold')
    expect(screen.getByText('Chez A')).toBeInTheDocument()
    expect(screen.getByText('Chez B')).toBeInTheDocument()
  })

  it('forwards the category label to card icons by default', () => {
    render(
      <BentoSection
        title="À Annecy"
        rows={[row('a', 'Chez A'), row('b', 'Chez B')]}
        fallbackCitySlug="sg"
      />,
    )
    expect(screen.getAllByRole('img', { name: 'Restaurants' })).toHaveLength(2)
  })

  it('returns null when there are no rows', () => {
    const { container } = render(<BentoSection title="Vide" rows={[]} fallbackCitySlug="sg" />)
    expect(container).toBeEmptyDOMElement()
  })
})
