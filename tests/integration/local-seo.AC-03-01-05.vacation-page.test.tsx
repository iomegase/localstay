/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

jest.mock('@/features/lodging-showcase/queries/public-lodgings', () => ({
  listPublishedMarketingLodgingsForCity: jest.fn(),
}))

import VacationRentalCityPage, {
  generateMetadata,
} from '@/app/(public)/locations-vacances/[city-slug]/page'
import { listPublishedMarketingLodgingsForCity } from '@/features/lodging-showcase/queries/public-lodgings'

const airbnbLodging = {
  id: 'profile-1',
  slug: 'chalet-hygge',
  city_slug: 'saint-gervais-les-bains',
  city_name: 'Saint-Gervais-les-Bains',
  title: 'Le Chalet Hygge',
  cover_photo_url: 'https://images.example/chalet.webp',
  short_description: 'Un chalet chaleureux face aux montagnes.',
  property_type: 'Chalet',
  max_guests: 6,
  bedroom_count: 3,
  bathroom_count: 2,
  surface_m2: 110,
  public_area_label: 'Saint-Gervais-les-Bains',
  amenities: ['Wi-Fi'],
  href: '/logements/chalet-hygge',
  external_booking_url: 'https://www.airbnb.fr/rooms/123',
  external_booking_platform: 'airbnb',
}

describe('046 local vacation rental pages', () => {
  beforeEach(() => {
    jest.mocked(listPublishedMarketingLodgingsForCity).mockReset()
  })

  it('renders published lodging links and a verified secure Airbnb CTA', async () => {
    jest.mocked(listPublishedMarketingLodgingsForCity).mockResolvedValue([airbnbLodging])
    const params = Promise.resolve({ 'city-slug': 'saint-gervais-les-bains' })

    render(await VacationRentalCityPage({ params }))

    expect(screen.getByRole('heading', {
      level: 1,
      name: 'Locations de vacances à Saint-Gervais-les-Bains',
    })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Découvrir Le Chalet Hygge' })).toHaveAttribute(
      'href',
      '/logements/chalet-hygge',
    )
    expect(screen.getByRole('link', { name: 'Voir sur Airbnb' })).toHaveAttribute(
      'href',
      'https://www.airbnb.fr/rooms/123',
    )
    expect(screen.getByRole('link', { name: 'Voir sur Airbnb' })).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('link', { name: 'Voir sur Airbnb' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    )

    const metadata = await generateMetadata({ params })
    expect(metadata.robots).toEqual({ index: true, follow: true })
  })

  it('does not render Airbnb for a non-Airbnb or non-HTTPS link', async () => {
    jest.mocked(listPublishedMarketingLodgingsForCity).mockResolvedValue([
      { ...airbnbLodging, external_booking_platform: 'booking' },
      {
        ...airbnbLodging,
        id: 'profile-2',
        slug: 'chalet-insecure',
        title: 'Chalet Insecure',
        href: '/logements/chalet-insecure',
        external_booking_url: 'http://www.airbnb.fr/rooms/456',
      },
    ])

    render(await VacationRentalCityPage({
      params: Promise.resolve({ 'city-slug': 'saint-gervais-les-bains' }),
    }))

    expect(screen.queryByRole('link', { name: 'Voir sur Airbnb' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Découvrir Le Chalet Hygge' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Découvrir Chalet Insecure' })).toBeInTheDocument()
  })

  it('keeps a known empty destination useful and noindex, follow', async () => {
    jest.mocked(listPublishedMarketingLodgingsForCity).mockResolvedValue([])
    const params = Promise.resolve({ 'city-slug': 'combloux' })

    render(await VacationRentalCityPage({ params }))
    expect(screen.getByText(/Aucun logement MyStay n’est encore publié à Combloux/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voir tous les logements' })).toHaveAttribute(
      'href',
      '/logements',
    )
    expect(await generateMetadata({ params })).toEqual(expect.objectContaining({
      robots: { index: false, follow: true },
    }))
  })

  it('rejects an unknown destination', async () => {
    await expect(VacationRentalCityPage({
      params: Promise.resolve({ 'city-slug': 'ailleurs' }),
    })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(listPublishedMarketingLodgingsForCity).not.toHaveBeenCalled()
  })
})
