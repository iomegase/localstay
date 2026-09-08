/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { listPublishedLodgings } from '@/features/lodging-showcase/queries/public-lodgings'

jest.mock('@/features/lodging-showcase/queries/public-lodgings', () => ({
  listPublishedLodgings: jest.fn().mockResolvedValue([
    {
      id: 'lodging-1',
      slug: 'chalet-test',
      city_slug: 'saint-gervais-les-bains',
      city_name: 'Saint-Gervais-les-Bains',
      title: 'Chalet Test',
      cover_photo_url: '/marketing/demo-lodging-1.webp',
      short_description: 'Un chalet publié.',
      property_type: 'Chalet',
      max_guests: 6,
      bedroom_count: 3,
      bathroom_count: 2,
      surface_m2: 110,
      public_area_label: 'Saint-Gervais-les-Bains',
      amenities: [],
      href: '/logements/chalet-test',
      external_booking_url: null,
      external_booking_platform: null,
    },
  ]),
}))

import ConciergeCityPage from '@/app/(public)/conciergerie/[city-slug]/page'

const mockedListPublishedLodgings = jest.mocked(listPublishedLodgings)

describe('046 AC-06 mutualized concierge conversion landing', () => {
  beforeEach(() => {
    mockedListPublishedLodgings.mockClear()
  })

  it.each([
    {
      slug: 'saint-gervais-les-bains',
      city: 'Saint-Gervais-les-Bains',
      localHeading: 'Gérer un logement à Saint-Gervais-les-Bains',
      guideHref: '/decouvrir/saint-gervais-les-bains',
    },
    {
      slug: 'saint-nicolas-de-veroce',
      city: 'Saint-Nicolas-de-Véroce',
      localHeading: 'Gérer un logement à Saint-Nicolas-de-Véroce',
      guideHref: '/decouvrir/saint-nicolas-de-veroce',
    },
  ])('renders the shared conversion architecture with local content for $city', async ({
    slug,
    city,
    localHeading,
    guideHref,
  }) => {
    const page = await ConciergeCityPage({
      params: Promise.resolve({ 'city-slug': slug }),
    })
    const { container } = render(page)

    expect(screen.getByRole('heading', {
      level: 1,
      name: `Conciergerie à ${city}`,
    })).toBeInTheDocument()
    expect(screen.getByRole('heading', {
      name: 'Des logements déjà confiés à MyStay',
    })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: localHeading })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: `Découvrir ${city}` })).toHaveAttribute(
      'href',
      guideHref,
    )
    expect(screen.getByText('Comment se passe la mise en gestion ?')).toBeInTheDocument()
    expect(screen.queryByText("L'expérience de nos voyageurs")).not.toBeInTheDocument()
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(container.innerHTML).not.toContain('aggregateRating')
    expect(container.innerHTML).not.toContain('font-serif')
    expect(mockedListPublishedLodgings).toHaveBeenLastCalledWith({ limit: 3 })
  })
})
