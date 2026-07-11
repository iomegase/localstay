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

function row(id: string, name: string, category = { name: 'Restaurants', slug: 'restaurants', icon: 'utensils' }): RecRow {
  return {
    poi_id: id,
    owner_note: null,
    poi: {
      id, name, slug: id, description: null, photos: [],
      category,
      city: null,
    },
  }
}

describe('BentoSection', () => {
  it('renders a light category title with the category icon when requested', () => {
    render(
      <BentoSection
        eyebrow="Sélection principale"
        title="Location de skis"
        rows={[
          row('a', 'Chez A', { name: 'Location de skis', slug: 'location-de-skis', icon: 'utensils' }),
          row('b', 'Chez B', { name: 'Location de skis', slug: 'location-de-skis', icon: 'utensils' }),
        ]}
        fallbackCitySlug="sg"
        showCardCategory={false}
        showTitleCategoryIcon
      />,
    )
    const title = screen.getByRole('heading', { level: 2, name: 'Location de skis' })
    expect(title).toHaveClass('font-light')
    expect(title).not.toHaveClass('font-semibold')
    const iconWrapper = title.querySelector('span[aria-hidden="true"]')
    expect(iconWrapper).toHaveClass('h-11', 'w-11', 'bg-slate-100', 'text-slate-800')
    expect(title.querySelector('svg')).toHaveClass('h-6', 'w-6')
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
