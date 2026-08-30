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
const mockPermanentRedirect = jest.fn()

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
  permanentRedirect: (destination: string) => mockPermanentRedirect(destination),
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
  getPublishedLodgingDetailBySlug: jest.fn(),
}))

jest.mock('@/shared/components/JsonLd', () => ({
  JsonLd: ({ data }: { data: unknown }) => (
    <script data-testid="json-ld">{JSON.stringify(data)}</script>
  ),
}))

import { getCityForSeo } from '@/features/seo/queries/page-data'
import {
  getPublishedLodgingDetail,
  getPublishedLodgingDetailBySlug,
  listPublishedLodgingsForCity,
} from '@/features/lodging-showcase/queries/public-lodgings'
import LegacyLodgingListPage from '@/app/(public)/guide/[city-slug]/logements/page'
import LegacyLodgingDetailPage from '@/app/(public)/guide/[city-slug]/logements/[lodging-slug]/page'
import LodgingDetailPage, {
  generateMetadata as generateLodgingDetailMetadata,
} from '@/app/(public)/logements/[lodging-slug]/page'
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
  getActiveLodgingContext: jest.fn().mockResolvedValue({
    lodgingId: '11111111-1111-1111-1111-111111111111',
    lodgingName: 'Chalet MyStay',
    citySlug: 'annecy',
    cityName: 'Annecy',
    ownerName: 'Marie',
  }),
}))
jest.mock('@/features/categories/queries/all-poi-cards', () => ({
  getAllPoiCards: jest.fn().mockResolvedValue({ items: [], meta: { page: 1, limit: 10, total: 0, total_pages: 0 } }),
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
      href: '/logements/chalet-hygge',
    },
  ],
  meta: { page: 1, limit: 12, total: 1, total_pages: 1 },
}

const detailResult = {
  ...listResult.items[0],
  city_name: 'Annecy',
  city_region: 'Auvergne-Rhone-Alpes',
  description: 'Une description detaillee du chalet Hygge pour la page publique.',
  photos: [
    { id: 'photo-1', url: 'https://img.test/cover.webp', alt: 'Salon', room_type: 'common_area', room_label: 'Salon', sort_order: 0, is_cover: true },
    { id: 'photo-2', url: 'https://img.test/bedroom.webp', alt: 'Chambre', room_type: 'bedroom', room_label: 'Chambre', sort_order: 1, is_cover: false },
    { id: 'photo-3', url: 'https://img.test/exterior.webp', alt: 'Extérieur', room_type: 'exterior', room_label: 'Extérieur', sort_order: 2, is_cover: false },
  ],
  bathroom_count: 1,
  bed_count: 3,
  surface_m2: 70,
  external_booking_url: 'https://www.airbnb.fr/rooms/123456789',
  external_booking_platform: 'airbnb',
  public_contact_enabled: true,
  owner_recommendations: [
    {
      id: 'poi-local',
      name: 'Le Port',
      slug: 'le-port',
      category_slug: 'restaurants',
      city_slug: 'annecy',
      city_name: 'Annecy',
      owner_note: 'Ideal pour diner au bord de l eau.',
      photo_url: null,
    },
    {
      id: 'poi-other',
      name: 'Aiguille du Midi',
      slug: 'aiguille-du-midi',
      category_slug: 'explorer',
      city_slug: 'chamonix',
      city_name: 'Chamonix',
      owner_note: 'A reserver par temps clair.',
      photo_url: null,
    },
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
    ;(getPublishedLodgingDetailBySlug as jest.Mock).mockResolvedValue(detailResult)
  })

  it('permanently redirects the legacy city lodging list without querying lodging data', async () => {
    await LegacyLodgingListPage()

    expect(mockPermanentRedirect).toHaveBeenCalledWith('/logements')
    expect(getCityForSeo).not.toHaveBeenCalled()
    expect(listPublishedLodgingsForCity).not.toHaveBeenCalled()
  })

  it('renders the public lodging detail page from its globally unique slug', async () => {
    const jsx = await LodgingDetailPage({
      params: Promise.resolve({ 'lodging-slug': 'chalet-hygge' }),
    })
    render(jsx)

    expect(getPublishedLodgingDetailBySlug).toHaveBeenCalledWith('chalet-hygge')
    expect(screen.getByTestId('json-ld')).toHaveTextContent(
      'https://www.mystay.city/logements/chalet-hygge',
    )
    expect(screen.getByTestId('json-ld')).toHaveTextContent('"name":"Logements"')
    expect(screen.getByTestId('json-ld')).not.toHaveTextContent('/guide/annecy/logements')
    expect(screen.getByTestId('marketing-stage')).toBeInTheDocument()
    expect(screen.getByTestId('marketing-surface')).toHaveClass(
      'md:max-w-[1184px]',
      'md:rounded-[42px]',
      'xl:rounded-[34px]',
    )
    expect(screen.getAllByText('Chalet Hygge').length).toBeGreaterThan(0)
    expect(screen.getByText('Un chalet lumineux pour decouvrir Annecy.')).toBeInTheDocument()
    expect(screen.getByText('Une description detaillee du chalet Hygge pour la page publique.')).toBeInTheDocument()
    expect(screen.getByText('Équipements')).toBeInTheDocument()
    expect(screen.getByText('Wi-Fi')).toBeInTheDocument()
    expect(screen.getByText('Réserver ce logement')).toBeInTheDocument()

    const structuredData = JSON.parse(
      screen.getByTestId('json-ld').textContent ?? '[]',
    ) as Array<Record<string, unknown>>
    const lodgingSchema = structuredData.find(item => item['@type'] === 'VacationRental')
      ?? structuredData.find(item => item['@type'] === 'LodgingBusiness')

    expect(lodgingSchema).toMatchObject({
      name: detailResult.title,
      description: detailResult.short_description,
      url: 'https://www.mystay.city/logements/chalet-hygge',
      provider: { '@id': 'https://www.mystay.city/#organization' },
      image: detailResult.photos.map(photo => photo.url),
      address: {
        addressLocality: detailResult.public_area_label,
      },
    })
    expect(JSON.stringify(lodgingSchema)).not.toContain(detailResult.city_region)
    for (const photo of detailResult.photos) {
      expect(screen.getAllByRole('img', { name: photo.alt }).length).toBeGreaterThan(0)
    }
    for (const amenity of detailResult.amenities) {
      expect(screen.getAllByText(amenity).length).toBeGreaterThan(0)
    }
    expect(screen.getAllByText(detailResult.public_area_label).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'bonjour@mystay.city' })).toHaveAttribute(
      'href',
      'mailto:bonjour@mystay.city',
    )
    expect(screen.getByText('Haute-Savoie, France')).toBeInTheDocument()

    for (const contactLink of screen.getAllByRole('link', { name: 'Contacter' })) {
      expect(contactLink).toHaveAttribute('href', '/guide/annecy/contact?lodging=profile-1')
      expect(contactLink).toHaveAttribute('data-analytics-event', 'lodging_contact_click')
      expect(contactLink).toHaveAttribute('data-analytics-city-slug', 'annecy')
      expect(contactLink).toHaveAttribute('data-analytics-lodging-id', 'profile-1')
      expect(contactLink).toHaveAttribute('rel', 'nofollow')
    }

    for (const bookingLink of screen.getAllByRole('link', { name: 'Reserver sur Airbnb' })) {
      expect(bookingLink).toHaveAttribute('data-analytics-event', 'lodging_external_booking_click')
      expect(bookingLink).toHaveAttribute('data-analytics-city-slug', 'annecy')
      expect(bookingLink).toHaveAttribute('data-analytics-lodging-id', 'profile-1')
    }
  })

  it('follows the approved editorial property-detail hierarchy', async () => {
    const jsx = await LodgingDetailPage({
      params: Promise.resolve({ 'lodging-slug': 'chalet-hygge' }),
    })
    render(jsx)

    expect(screen.getByTestId('lodging-detail-heading')).toBeInTheDocument()
    expect(screen.getByTestId('lodging-marketing-gallery')).toHaveAttribute(
      'aria-label',
      'Photos de Chalet Hygge',
    )
    expect(screen.getByTestId('lodging-story')).toContainElement(
      screen.getByRole('heading', { name: 'Un chalet lumineux pour decouvrir Annecy.' }),
    )
    expect(screen.getByTestId('lodging-stay-card')).toHaveTextContent('Votre séjour')
    expect(screen.getByRole('heading', { name: 'Les essentiels, en un coup d’œil.' })).toBeInTheDocument()
    const features = screen.getByTestId('lodging-feature-sections')
    expect(features).toHaveTextContent('Équipements')
    expect(features).not.toHaveTextContent('Le confort essentiel')
    expect(features).not.toHaveTextContent('Couchages')
    expect(screen.getByText("L'espace de vie")).toBeInTheDocument()
  })

  it('renders a compact factual essentials band without invented stay details', async () => {
    const jsx = await LodgingDetailPage({
      params: Promise.resolve({ 'lodging-slug': 'chalet-hygge' }),
    })
    render(jsx)

    const section = screen.getByTestId('lodging-essentials')
    expect(section).toHaveClass('xl:py-10')
    expect(section.querySelectorAll('dl > div')).toHaveLength(4)
    expect(section).toHaveTextContent('Voyageurs')
    expect(section).toHaveTextContent('Chambres')
    expect(section).toHaveTextContent('Salles de bain')
    expect(section).not.toHaveTextContent('couchage')
    // Valeurs : chiffre seul, sauf la surface qui garde son unité.
    const values = Array.from(section.querySelectorAll('dd')).map(dd => dd.textContent)
    expect(values).toEqual(['70 m²', '4', '2', '1'])
    expect(section).not.toHaveTextContent('Arrivée')
    expect(section).not.toHaveTextContent('Départ')
    expect(section).not.toHaveTextContent('€')
  })

  it('does not render owner recommendation blocks on the marketing detail page', async () => {
    const jsx = await LodgingDetailPage({
      params: Promise.resolve({ 'lodging-slug': 'chalet-hygge' }),
    })
    render(jsx)

    expect(screen.queryByText('Les recommandations de votre hôte')).not.toBeInTheDocument()
    expect(screen.queryByText('À découvrir ailleurs')).not.toBeInTheDocument()
    expect(screen.queryByText('Le Port')).not.toBeInTheDocument()
    expect(screen.queryByText('Aiguille du Midi')).not.toBeInTheDocument()
  })

  it('hides external booking and contact CTAs when disabled', async () => {
    ;(getPublishedLodgingDetailBySlug as jest.Mock).mockResolvedValue({
      ...detailResult,
      external_booking_url: null,
      public_contact_enabled: false,
    })

    const jsx = await LodgingDetailPage({
      params: Promise.resolve({ 'lodging-slug': 'chalet-hygge' }),
    })
    render(jsx)

    expect(screen.queryByText('Reserver sur Airbnb')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Contacter' })).not.toBeInTheDocument()
  })

  it.each(['unknown', 'unpublished', 'inactive', 'deleted'])(
    'returns notFound for an %s lodging profile',
    async () => {
      ;(getPublishedLodgingDetailBySlug as jest.Mock).mockResolvedValue(null)

      const result = await LodgingDetailPage({
        params: Promise.resolve({ 'lodging-slug': 'chalet-hygge' }),
      })

      expect(result).toBeNull()
      expect(mockNotFound).toHaveBeenCalledTimes(1)
    },
  )

  it('returns fully non-indexable metadata when the short lodging is unavailable', async () => {
    ;(getPublishedLodgingDetailBySlug as jest.Mock).mockResolvedValue(null)

    const metadata = await generateLodgingDetailMetadata({
      params: Promise.resolve({ 'lodging-slug': 'chalet-hygge' }),
    })

    expect(metadata.robots).toEqual({ index: false, follow: false, noarchive: true })
  })

  it('permanently redirects an eligible legacy detail to the short lodging URL', async () => {
    await LegacyLodgingDetailPage({
      params: Promise.resolve({ 'city-slug': 'annecy', 'lodging-slug': 'chalet-hygge' }),
    })

    expect(getPublishedLodgingDetail).toHaveBeenCalledWith('annecy', 'chalet-hygge')
    expect(mockPermanentRedirect).toHaveBeenCalledWith('/logements/chalet-hygge')
  })

  it('returns notFound for a legacy detail without an eligible city/profile match', async () => {
    ;(getPublishedLodgingDetail as jest.Mock).mockResolvedValue(null)

    const result = await LegacyLodgingDetailPage({
      params: Promise.resolve({ 'city-slug': 'wrong-city', 'lodging-slug': 'chalet-hygge' }),
    })

    expect(result).toBeNull()
    expect(mockNotFound).toHaveBeenCalledTimes(1)
    expect(mockPermanentRedirect).not.toHaveBeenCalled()
  })

  it('keeps the guide page free of lodging cards in the main flow', async () => {
    const jsx = await GuidePage({ params: Promise.resolve({ 'city-slug': 'annecy' }) })
    render(jsx)

    expect(screen.queryByText('Sejourner a Annecy')).not.toBeInTheDocument()
    expect(screen.queryByText('Voir tous les logements')).not.toBeInTheDocument()
  })
})
