/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import NosRecommendationsPage from '@/app/(public)/nos-recommandations/page'
import { prisma } from '@/shared/lib/prisma'

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn(async () => ({
    lodgingId: 'lodging-1',
    lodgingName: 'Chalet MyStay',
    citySlug: 'saint-gervais',
    cityName: 'Saint-Gervais-les-Bains',
    ownerName: 'Alice Martin',
  })),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodgingFeaturedPoi: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

describe('012 recommendations page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('AC-02-01/AC-02-02: shows owner recommendations on /nos-recommandations', async () => {
    jest.mocked(prisma.lodgingFeaturedPoi.findMany).mockResolvedValue([
      {
        poi_id: 'poi-1',
        owner_note: 'Notre choix pour un dîner calme en terrasse.',
        poi: {
          id: 'poi-1',
          name: 'Bistrot du Centre',
          slug: 'bistrot-du-centre',
          description: 'Cuisine locale.',
          photos: ['https://cdn.example.test/bistrot.jpg'],
          category: { name: 'Restaurants', slug: 'restaurants' },
        },
      },
    ] as never)

    render(await NosRecommendationsPage())

    expect(screen.getByText('Les recommandations de Alice Martin')).toBeInTheDocument()
    expect(screen.getByText('Restaurants')).toBeInTheDocument()
    // Les notes owner ne sont plus affichées sur les cartes (retirées pour alléger la mise en page).
    expect(
      screen.queryByText('Notre choix pour un dîner calme en terrasse.'),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Bistrot du Centre/i })).toHaveAttribute(
      'href',
      '/guide/saint-gervais/restaurants/bistrot-du-centre',
    )
  })

  it('AC-02-02: does not reserve comment space when the owner note is absent', async () => {
    jest.mocked(prisma.lodgingFeaturedPoi.findMany).mockResolvedValue([
      {
        poi_id: 'poi-1',
        owner_note: null,
        poi: {
          id: 'poi-1',
          name: 'Bistrot du Centre',
          slug: 'bistrot-du-centre',
          description: 'Cuisine locale.',
          photos: [],
          category: { name: 'Restaurants', slug: 'restaurants' },
        },
      },
    ] as never)

    render(await NosRecommendationsPage())

    expect(screen.queryByTestId('owner-recommendation-comment')).not.toBeInTheDocument()
  })

  it('AC-02-01: shows an empty state linking back to the full guide when no recommendation exists', async () => {
    jest.mocked(prisma.lodgingFeaturedPoi.findMany).mockResolvedValue([] as never)

    render(await NosRecommendationsPage())

    expect(screen.getByText(/n'a pas encore sélectionné/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voir le guide complet' })).toHaveAttribute(
      'href',
      '/guide/saint-gervais',
    )
  })
})
