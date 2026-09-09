/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { listPublishedLodgings } from '@/features/lodging-showcase/queries/public-lodgings'
import { listPublicLandingReviews } from '@/features/local-seo/queries/landing-reviews'
import { getPublishedLocalLanding } from '@/features/local-seo/queries/landing-pages'
import { publicLocalLanding } from '../fixtures/public-local-landing'
import { buildLocalLandingBackfill } from '../../prisma/backfill-local-landing-destinations'
import { legacyConciergeServices, legacyConciergeSteps, legacyConciergeProcessTitle } from '../fixtures/legacy-concierge-blocks'

jest.mock('@/features/local-seo/queries/landing-pages', () => ({ getPublishedLocalLanding: jest.fn() }))

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

jest.mock('@/features/local-seo/queries/landing-reviews', () => ({
  listPublicLandingReviews: jest.fn().mockResolvedValue([]),
}))

import ConciergeCityPage from '@/app/(public)/conciergerie/[city-slug]/page'

const mockedListPublishedLodgings = jest.mocked(listPublishedLodgings)
const mockedListPublicLandingReviews = jest.mocked(listPublicLandingReviews)

describe('046 AC-06 mutualized concierge conversion landing', () => {
  beforeEach(() => {
    mockedListPublishedLodgings.mockClear()
    mockedListPublicLandingReviews.mockClear()
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
    const landing = publicLocalLanding('CONCIERGE', { id: slug, name: city, slug })
    landing.page = buildLocalLandingBackfill().find(seed => seed.slug === slug)!.pages[0]
    jest.mocked(getPublishedLocalLanding).mockResolvedValue(landing)
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
    const services = screen.getByRole('heading', { name: 'Nous prenons soin de votre location' }).parentElement!
    expect(Array.from(services.querySelectorAll('article'), article => [
      article.querySelector('h3')?.textContent, article.querySelector('p')?.textContent,
    ])).toEqual(legacyConciergeServices)
    const process = screen.getByRole('heading', { name: legacyConciergeProcessTitle }).parentElement!
    expect(Array.from(process.querySelectorAll('li'), step => [
      step.querySelector('h3')?.textContent, step.querySelector('p')?.textContent,
    ])).toEqual(legacyConciergeSteps)
    expect(screen.queryByText("L'expérience de nos voyageurs")).not.toBeInTheDocument()
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(container.innerHTML).not.toContain('aggregateRating')
    expect(container.innerHTML).not.toContain('font-serif')
    expect(mockedListPublishedLodgings).toHaveBeenLastCalledWith({ limit: 3 })
    expect(mockedListPublicLandingReviews).toHaveBeenLastCalledWith(slug)
  })
})
