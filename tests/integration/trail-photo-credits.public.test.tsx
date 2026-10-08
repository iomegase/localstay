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

describe('PO 2026-10-08 — crédits des photos de randonnée sur la fiche publique', () => {
  async function detail(overrides: Record<string, unknown> = {}) {
    mockPoiFindMany.mockResolvedValue([row(overrides)])
    const value = await getDiscoveryPoi('saint-gervais-les-bains', 'diner', 'brasserie-du-mont-blanc')
    if (!value) throw new Error('fixture invalide')
    return value
  }

  it('randonnée : « Crédits photos » avec un lien par auteur, à la place du crédit générique', async () => {
    render(<DiscoveryPoiView poi={await detail({ phone: null, website: null, trail_detail: { deleted_at: null, source_refs: [
      { type: 'overpass', attribution: 'OpenStreetMap contributors', used_for: ['geometry'] },
      { type: 'official_website', url: 'https://rando.nature-haute-savoie.fr/trek/149', attribution: 'Teddy Bracard - CEN 74 — Geotrek Haute-Savoie', used_for: ['photos'] },
    ] } })} />)
    const credits = screen.getByTestId('poi-trail-photo-credits')
    expect(credits).toHaveTextContent('Crédits photos : Teddy Bracard - CEN 74 — Geotrek Haute-Savoie')
    expect(within(credits).getByRole('link')).toHaveAttribute('href', 'https://rando.nature-haute-savoie.fr/trek/149')
    expect(screen.queryByTestId('poi-photo-credit')).not.toBeInTheDocument()
  })

  it('lieu ordinaire : crédit habituel, pas de ligne randonnée', async () => {
    render(<DiscoveryPoiView poi={await detail()} />)
    expect(screen.queryByTestId('poi-trail-photo-credits')).not.toBeInTheDocument()
    expect(screen.getByTestId('poi-photo-credit')).toBeInTheDocument()
  })
})
