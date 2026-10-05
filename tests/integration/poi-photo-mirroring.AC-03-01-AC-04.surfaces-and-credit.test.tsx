/** @jest-environment jsdom */
import { render, screen, within } from '@testing-library/react'

const mockPoiFindMany = jest.fn()
jest.mock('server-only', () => ({}), { virtual: true })
jest.mock('@/shared/lib/prisma', () => ({
  prisma: { pointOfInterest: { findMany: (...args: unknown[]) => mockPoiFindMany(...args) } },
}))
jest.mock('next/navigation', () => ({ usePathname: () => '/decouvrir/saint-gervais-les-bains/diner/brasserie-du-mont-blanc' }))

const ORIGINAL = 'https://www.brasserie.example/a.jpg'
const COPY = 'https://abcdefgh.supabase.co/storage/v1/object/public/guide-photos/pois/poi-1/abc.webp'
jest.mock('@/features/poi-photos/queries/photo-mirror-map', () => ({
  getPoiPhotoMirrorMap: jest.fn(async () => new Map([[ORIGINAL, COPY]])),
  resolvePoiPhotoUrl: (url: string, map: ReadonlyMap<string, string>) => map.get(url) ?? url,
  resolvePoiPhotoList: (urls: string[], map: ReadonlyMap<string, string>) => urls.map(url => map.get(url) ?? url),
}))

import { getDiscoveryCity, getDiscoveryPoi } from '@/features/public-discovery/queries/public-discovery'
import { DiscoveryPoiView } from '@/features/public-discovery/components/DiscoveryPoiView'

beforeAll(() => { process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abcdefgh.supabase.co' })

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'poi-1',
    name: 'Brasserie du Mont Blanc',
    slug: 'brasserie-du-mont-blanc',
    description: 'Cuisine savoyarde et classiques de brasserie.',
    address: '31 Av. du Mont Paccard',
    latitude: 45.8921,
    longitude: 6.7085,
    phone: null,
    website: 'https://www.brasserie.example',
    rating: null,
    rating_count: 0,
    is_open_now: null,
    hours: null,
    photos: [ORIGINAL],
    discovery_status: 'PUBLISHED',
    discovery_published_at: new Date('2026-08-20T12:00:00.000Z'),
    is_active: true,
    deleted_at: null,
    geocode_status: 'success',
    subcategory_id: null,
    city: {
      id: 'city-1', name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains', postal_code: '74170',
      department: 'Haute-Savoie', region: 'Auvergne-Rhône-Alpes', latitude: 45.8921, longitude: 6.7085,
      is_active: true, deleted_at: null,
    },
    category: { id: 'category-1', name: 'Restaurant', slug: 'diner', icon: 'utensils', sort_order: 1, is_active: true, deleted_at: null },
    subcategory: null,
    ...overrides,
  }
}

beforeEach(() => jest.clearAllMocks())

describe('063 AC-03-01 — les surfaces publiques utilisent la copie', () => {
  it('la fiche sert la copie pour l’image principale et la galerie, et crédite l’origine', async () => {
    mockPoiFindMany.mockResolvedValue([row()])
    const detail = await getDiscoveryPoi('saint-gervais-les-bains', 'diner', 'brasserie-du-mont-blanc')
    expect(detail?.hero_photo_url).toBe(COPY)
    expect(detail?.photos).toEqual([COPY])
    expect(detail?.photo_credit).toEqual({ name: 'Brasserie du Mont Blanc', website: 'https://www.brasserie.example/' })
  })

  it('AC-04-03: pas de crédit quand toutes les photos sont des photos MyStay', async () => {
    mockPoiFindMany.mockResolvedValue([row({ photos: ['https://abcdefgh.supabase.co/storage/v1/object/public/guide-photos/admin/x.webp'] })])
    const detail = await getDiscoveryPoi('saint-gervais-les-bains', 'diner', 'brasserie-du-mont-blanc')
    expect(detail?.photo_credit).toBeNull()
  })

  it('les cartes de la page ville servent la copie', async () => {
    mockPoiFindMany.mockResolvedValue([row()])
    const city = await getDiscoveryCity('saint-gervais-les-bains')
    expect(city?.categories[0].pois[0].photo_url).toBe(COPY)
  })
})

describe('063 US-04 — ligne de crédit', () => {
  async function detail(overrides: Record<string, unknown> = {}) {
    mockPoiFindMany.mockResolvedValue([row(overrides)])
    const value = await getDiscoveryPoi('saint-gervais-les-bains', 'diner', 'brasserie-du-mont-blanc')
    if (!value) throw new Error('fixture invalide')
    return value
  }

  it('AC-04-01 / AC-04-02: après la description, avant les boutons, avec lien vers le site', async () => {
    render(<DiscoveryPoiView poi={await detail()} />)
    const credit = screen.getByTestId('poi-photo-credit')
    expect(credit).toHaveTextContent('Photos : Brasserie du Mont Blanc')
    const link = within(credit).getByRole('link', { name: 'Brasserie du Mont Blanc' })
    expect(link).toHaveAttribute('href', 'https://www.brasserie.example/')
    expect(link).toHaveAttribute('rel', 'nofollow noopener')
    expect(link).toHaveAttribute('target', '_blank')
    const description = screen.getByText('Cuisine savoyarde et classiques de brasserie.')
    expect(description.compareDocumentPosition(credit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const siteButton = screen.getByRole('link', { name: /Site officiel/ })
    expect(credit.compareDocumentPosition(siteButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('AC-04-02: nom seul sans site officiel', async () => {
    // Un POI publié garde au moins un contact : téléphone à la place du site.
    render(<DiscoveryPoiView poi={await detail({ website: null, phone: '+33450000000' })} />)
    const credit = screen.getByTestId('poi-photo-credit')
    expect(credit).toHaveTextContent('Photos : Brasserie du Mont Blanc')
    expect(within(credit).queryByRole('link')).not.toBeInTheDocument()
  })

  it('AC-04-03: aucune ligne sans photo tierce', async () => {
    render(<DiscoveryPoiView poi={await detail({ photos: ['https://abcdefgh.supabase.co/storage/v1/object/public/guide-photos/admin/x.webp'] })} />)
    expect(screen.queryByTestId('poi-photo-credit')).not.toBeInTheDocument()
  })
})
