/**
 * @jest-environment jsdom
 *
 * En mode séjour, la home / rend le contenu « Nos recommandations »
 * (le bento des lieux choisis par l'hôte), pas le bento des catégories.
 */
import { render, screen } from '@testing-library/react'
import HomePage from '@/app/(public)/page'
import { prisma } from '@/shared/lib/prisma'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'

jest.mock('@/features/analytics/lib/record-qr-scan', () => ({
  recordQrScanIfPresent: jest.fn(),
}))

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn(),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodgingFeaturedPoi: { findMany: jest.fn() },
    lodgingCustomization: { findFirst: jest.fn() },
  },
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

const mockContext = getActiveLodgingContext as jest.Mock

describe('HomePage — mode séjour', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue(null)
    mockContext.mockResolvedValue({
      lodgingId: 'lodging-1',
      lodgingName: 'Chalet Rémy',
      citySlug: 'saint-gervais',
      cityName: 'Saint-Gervais-les-Bains',
      ownerName: 'Alice',
    })
  })

  it('renders the recommendations content with featured POIs', async () => {
    jest.mocked(prisma.lodgingFeaturedPoi.findMany).mockResolvedValue([
      {
        poi_id: 'poi-1',
        owner_note: 'Notre choix.',
        poi: {
          id: 'poi-1',
          name: 'Bistrot du Centre',
          slug: 'bistrot-du-centre',
          description: 'Cuisine locale.',
          photos: ['https://cdn.test/x.jpg'],
          category: { name: 'Restaurants', slug: 'restaurants' },
          city: { slug: 'saint-gervais', name: 'Saint-Gervais-les-Bains' },
        },
      },
    ] as never)

    render(await HomePage())

    expect(screen.getByText('Les recommandations de Alice')).toBeInTheDocument()
    expect(screen.getByText('Bistrot du Centre')).toBeInTheDocument()
  })

  it('renders the recommendations empty state when the host has no picks', async () => {
    jest.mocked(prisma.lodgingFeaturedPoi.findMany).mockResolvedValue([] as never)

    render(await HomePage())

    expect(screen.getByText(/n'a pas encore sélectionné/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voir le guide complet' })).toHaveAttribute(
      'href',
      '/guide/saint-gervais',
    )
  })
})
