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
  it('renders the eyebrow, title and a card per row', () => {
    render(
      <BentoSection
        eyebrow="Sélection principale"
        title="Restaurants"
        rows={[row('a', 'Chez A'), row('b', 'Chez B')]}
        fallbackCitySlug="sg"
        showCardCategory={false}
      />,
    )
    expect(screen.getByText('Sélection principale')).toBeInTheDocument()
    expect(screen.getByText('Restaurants')).toBeInTheDocument()
    expect(screen.getByText('Chez A')).toBeInTheDocument()
    expect(screen.getByText('Chez B')).toBeInTheDocument()
  })

  it('forwards the category label to cards by default', () => {
    render(
      <BentoSection
        title="À Annecy"
        rows={[row('a', 'Chez A'), row('b', 'Chez B')]}
        fallbackCitySlug="sg"
      />,
    )
    // Both cards show their category label.
    expect(screen.getAllByText('Restaurants')).toHaveLength(2)
  })

  it('returns null when there are no rows', () => {
    const { container } = render(<BentoSection title="Vide" rows={[]} fallbackCitySlug="sg" />)
    expect(container).toBeEmptyDOMElement()
  })
})
