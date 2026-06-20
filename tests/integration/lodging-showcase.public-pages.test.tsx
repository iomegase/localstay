/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'

jest.mock('mapbox-gl', () => ({
  __esModule: true,
  default: {
    accessToken: '',
    Map: class {
      on() {}
      remove() {}
      addControl() {}
    },
    Marker: class {
      setLngLat() { return this }
      addTo() { return this }
    },
    NavigationControl: class {},
  },
}))

const mockNotFound = jest.fn()

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

jest.mock('@/features/seo/queries/page-data', () => ({
  getCityForSeo: jest.fn(),
}))

jest.mock('@/features/lodging-showcase/queries/public-lodgings', () => ({
  listPublishedLodgingsForCity: jest.fn(),
  getPublishedLodgingDetail: jest.fn(),
}))

jest.mock('@/shared/components/JsonLd', () => ({
  JsonLd: () => null,
}))

import { getCityForSeo } from '@/features/seo/queries/page-data'
import {
  getPublishedLodgingDetail,
  listPublishedLodgingsForCity,
} from '@/features/lodging-showcase/queries/public-lodgings'
import LodgingListPage from '@/app/(public)/guide/[city-slug]/logements/page'
import LodgingDetailPage from '@/app/(public)/guide/[city-slug]/logements/[lodging-slug]/page'
import GuidePage from '@/app/(public)/guide/[city-slug]/page'

jest.mock('@/features/city-guide/queries/cities', () => ({
  getCityGuide: jest.fn().mockResolvedValue({
    city: {
      id: 'city-1',
      name: 'Annecy',
      slug: 'annecy',
      postal_code: '74000',
      department: 'Haute-Savoie',
    },
    categories: [],
    welcome_message: null,
  }),
}))
jest.mock('@/features/events-public/queries/agenda', () => ({
  cityHasUpcomingEventsBySlug: jest.fn().mockResolvedValue(false),
}))
jest.mock('@/features/analytics/lib/record-qr-scan', () => ({
  recordQrScanIfPresent: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn().mockResolvedValue(null),
}))
jest.mock('@/features/categories/queries/all-poi-cards', () => ({
  getAllPoiCards: jest.fn().mockResolvedValue({ items: [], meta: { page: 1, limit: 10, total: 0, total_pages: 0 } }),
}))
jest.mock('@/features/weather/queries/weather-city', () => ({
  getWeatherCity: jest.fn().mockResolvedValue(null),
}))
jest.mock('@/shared/components/MarkdownText', () => ({
  MarkdownText: ({ source }: { source?: string | null }) => <div>{source}</div>,
}))

const city = { name: 'Annecy', slug: 'annecy', region: 'Auvergne-Rhone-Alpes' }

const listResult = {
  items: [
    {
      id: 'profile-1',
      slug: 'chalet-hygge',
      city_slug: 'annecy',
      title: 'Chalet Hygge',
      cover_photo_url: 'https://img.test/cover.webp',
      short_description: 'Un chalet lumineux pour decouvrir Annecy.',
      property_type: 'Chalet',
      max_guests: 4,
      bedroom_count: 2,
      public_area_label: 'Annecy-le-Vieux',
      amenities: ['Wi-Fi', 'Parking'],
      href: '/guide/annecy/logements/chalet-hygge',
    },
  ],
  meta: { page: 1, limit: 12, total: 1, total_pages: 1 },
}

const detailResult = {
  ...listResult.items[0],
  city_name: 'Annecy',
  city_region: 'Auvergne-Rhone-Alpes',
  description: 'Une description detaillee du chalet Hygge pour la page publique.',
  photos: [{ id: 'photo-1', url: 'https://img.test/cover.webp', alt: 'Salon', room_type: 'common_area', sort_order: 0, is_cover: true }],
  bathroom_count: 1,
  bed_count: 3,
  surface_m2: 70,
  external_booking_url: 'https://www.airbnb.fr/rooms/123456789',
  external_booking_platform: 'airbnb',
  public_contact_enabled: true,
  owner_recommendations: [
    { id: 'poi-1', name: 'Le Port', slug: 'le-port', category_slug: 'restaurants', photo_url: null },
  ],
  amenities_included: ['Wi-Fi', 'Parking'],
  amenities_on_request: [],
  faq: [],
  precise_location_public: false,
  public_latitude: null,
  public_longitude: null,
}

describe('lodging showcase public pages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getCityForSeo as jest.Mock).mockResolvedValue(city)
    ;(listPublishedLodgingsForCity as jest.Mock).mockResolvedValue(listResult)
    ;(getPublishedLodgingDetail as jest.Mock).mockResolvedValue(detailResult)
  })

  it('renders the public city lodging list', async () => {
    const jsx = await LodgingListPage({ params: Promise.resolve({ 'city-slug': 'annecy' }) })
    render(jsx)

    expect(screen.getByRole('heading', { name: 'Annecy' })).toBeInTheDocument()
    expect(screen.getByText('Chalet Hygge')).toBeInTheDocument()

    const card = screen.getByText('Chalet Hygge').closest('article')
    expect(card).toHaveClass('w-full')
    expect(card?.parentElement).toHaveClass('grid', 'grid-cols-1')
    expect(card?.parentElement).not.toHaveClass('md:grid-cols-2')
    expect(card?.parentElement).not.toHaveClass('xl:grid-cols-3')
  })

  it('renders the public lodging detail page', async () => {
    const jsx = await LodgingDetailPage({
      params: Promise.resolve({ 'city-slug': 'annecy', 'lodging-slug': 'chalet-hygge' }),
    })
    render(jsx)

    expect(screen.getAllByText('Chalet Hygge').length).toBeGreaterThan(0)
    expect(screen.getByText('Un chalet lumineux pour decouvrir Annecy.')).toBeInTheDocument()
    expect(screen.getByText('Une description detaillee du chalet Hygge pour la page publique.')).toBeInTheDocument()
    expect(screen.getByText('Équipements & Services')).toBeInTheDocument()
    expect(screen.getByText('compris dans le séjour')).toBeInTheDocument()
    expect(screen.getByText('Wi-Fi')).toBeInTheDocument()
    expect(screen.getByText('Réserver ou contacter')).toBeInTheDocument()
    expect(screen.getByText('Le Port')).toBeInTheDocument()
    expect(screen.getByText('Reserver sur Airbnb')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Contacter' })).toHaveAttribute('href', '/guide/annecy/contact?lodging=profile-1')
    expect(screen.getByRole('link', { name: 'Contacter' })).toHaveAttribute('data-analytics-event', 'lodging_contact_click')
    expect(screen.getByRole('link', { name: 'Contacter' })).toHaveAttribute('data-analytics-city-slug', 'annecy')
    expect(screen.getByRole('link', { name: 'Contacter' })).toHaveAttribute('data-analytics-lodging-id', 'profile-1')
    expect(screen.getByRole('link', { name: 'Reserver sur Airbnb' })).toHaveAttribute('data-analytics-event', 'lodging_external_booking_click')
    expect(screen.getByRole('link', { name: 'Reserver sur Airbnb' })).toHaveAttribute('data-analytics-city-slug', 'annecy')
    expect(screen.getByRole('link', { name: 'Reserver sur Airbnb' })).toHaveAttribute('data-analytics-lodging-id', 'profile-1')
  })

  it('hides external booking and contact CTAs when disabled', async () => {
    ;(getPublishedLodgingDetail as jest.Mock).mockResolvedValue({
      ...detailResult,
      external_booking_url: null,
      public_contact_enabled: false,
    })

    const jsx = await LodgingDetailPage({
      params: Promise.resolve({ 'city-slug': 'annecy', 'lodging-slug': 'chalet-hygge' }),
    })
    render(jsx)

    expect(screen.queryByText('Reserver sur Airbnb')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Contacter' })).not.toBeInTheDocument()
  })

  it('keeps the guide page free of lodging cards in the main flow', async () => {
    const jsx = await GuidePage({ params: Promise.resolve({ 'city-slug': 'annecy' }) })
    render(jsx)

    expect(screen.queryByText('Sejourner a Annecy')).not.toBeInTheDocument()
    expect(screen.queryByText('Voir tous les logements')).not.toBeInTheDocument()
  })
})
