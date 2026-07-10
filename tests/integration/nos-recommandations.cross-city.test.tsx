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
    ownerName: 'Alice',
  })),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodgingFeaturedPoi: { findMany: jest.fn() },
    lodgingCustomization: { findFirst: jest.fn() },
  },
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

function row(id: string, name: string, citySlug: string, cityName: string, categoryName = 'Nature') {
  return {
    poi_id: id,
    poi: {
      id, name, slug: id, description: null, photos: [],
      category: { name: categoryName, slug: categoryName.toLowerCase() },
      city: { slug: citySlug, name: cityName },
    },
  }
}

describe('/nos-recommandations — cross-city', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders an "À découvrir ailleurs" section grouped by city with city-slug links', async () => {
    jest.mocked(prisma.lodgingFeaturedPoi.findMany).mockResolvedValue([
      row('local1', 'Resto local', 'saint-gervais', 'Saint-Gervais-les-Bains'),
      row('far1', 'Le Lac', 'annecy', 'Annecy'),
    ] as never)

    render(await NosRecommendationsPage())

    expect(screen.getByText('Resto local')).toBeInTheDocument()
    expect(screen.getByText(/à découvrir ailleurs/i)).toBeInTheDocument()
    expect(screen.getByText(/à annecy/i)).toBeInTheDocument()
    const farLink = screen.getByText('Le Lac').closest('a')
    expect(farLink).toHaveAttribute('href', '/guide/annecy/nature/far1')
  })

  it('does not render category icons on "À découvrir ailleurs" cards', async () => {
    jest.mocked(prisma.lodgingFeaturedPoi.findMany).mockResolvedValue([
      row('far1', 'Le Lac', 'annecy', 'Annecy', 'Nature'),
    ] as never)

    render(await NosRecommendationsPage())

    expect(screen.getByText('Le Lac')).toBeInTheDocument()
    expect(screen.queryByLabelText('Nature')).not.toBeInTheDocument()
  })

  it('contracts plural city names in the "À découvrir ailleurs" title', async () => {
    jest.mocked(prisma.lodgingFeaturedPoi.findMany).mockResolvedValue([
      row('far1', 'Le Chalet', 'les-contamines-montjoie', 'Les Contamines-Montjoie'),
    ] as never)

    render(await NosRecommendationsPage())

    expect(screen.getByText(/aux contamines-montjoie/i)).toBeInTheDocument()
    expect(screen.queryByText(/à les contamines-montjoie/i)).not.toBeInTheDocument()
  })
})
