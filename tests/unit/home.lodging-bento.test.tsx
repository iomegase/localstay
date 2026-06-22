/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { LodgingHome } from '@/app/(public)/page'

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

jest.mock('@/features/city-guide/queries/cities', () => ({
  getCityGuide: jest.fn(),
}))

import { getCityGuide } from '@/features/city-guide/queries/cities'

const CATEGORIES = [
  { id: '1', name: 'Boulangerie', slug: 'boulangerie', icon: 'coffee', sort_order: 0, poi_count: 4 },
  { id: '2', name: 'Rando', slug: 'rando', icon: 'mountain', sort_order: 1, poi_count: 3 },
]

describe('LodgingHome', () => {
  beforeEach(() => {
    ;(getCityGuide as jest.Mock).mockResolvedValue({
      city: { id: 'c1', name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains', postal_code: '74170', department: null },
      categories: CATEGORIES,
      welcome_message: null,
    })
  })

  afterEach(() => jest.clearAllMocks())

  it('renders the landing-style category bento for the lodging city', async () => {
    const ui = await LodgingHome({ citySlug: 'saint-gervais-les-bains', lodgingId: 'lodge-1' })
    render(ui)

    expect(getCityGuide).toHaveBeenCalledWith('saint-gervais-les-bains', { lodgingId: 'lodge-1' })
    expect(screen.getByText('Boulangerie').closest('a')).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains/boulangerie?lodging=lodge-1',
    )
  })

  it('does not render the old host hero block', async () => {
    const ui = await LodgingHome({ citySlug: 'saint-gervais-les-bains', lodgingId: 'lodge-1' })
    render(ui)

    expect(screen.queryByText('Votre séjour')).not.toBeInTheDocument()
    expect(screen.queryByText('Découvrir le guide')).not.toBeInTheDocument()
  })
})
