/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'

jest.mock('server-only', () => ({}), { virtual: true })
jest.mock('@/shared/lib/prisma', () => ({ prisma: { pointOfInterest: { findMany: (...args: unknown[]) => mockPoiFindMany(...args) } } }))
jest.mock('next/navigation', () => ({ usePathname: () => '/decouvrir/saint-gervais-les-bains/randonnees/boucle-du-prarion' }))
jest.mock('@/features/poi-photos/queries/photo-mirror-map', () => ({
  getPoiPhotoMirrorMap: jest.fn(async () => new Map()),
  resolvePoiPhotoUrl: (url: string) => url,
  resolvePoiPhotoList: (urls: string[]) => urls,
}))
jest.mock('@/shared/components/MarkdownText', () => ({
  MarkdownText: ({ source, headingLevel, breaks }: { source: string; headingLevel?: number; breaks?: boolean }) => (
    <div data-testid="markdown" data-heading-level={headingLevel} data-breaks={String(Boolean(breaks))}>{source}</div>
  ),
}))

const mockPoiFindMany = jest.fn()

import { getDiscoveryPoi } from '@/features/public-discovery/queries/public-discovery'
import { DiscoveryPoiView } from '@/features/public-discovery/components/DiscoveryPoiView'

beforeAll(() => { process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abcdefgh.supabase.co' })

const DESCRIPTION = '## Montée\nDepuis la gare du Fayet, suivez le sentier balisé à travers la forêt jusqu’à l’hôtel-refuge du Prarion, puis la crête jusqu’au sommet.\n##Retour\nPar le col de la Forclaz et le hameau de Montfort, retour vers Saint-Gervais-les-Bains.'

it('renders the public POI description as Markdown with H2 sections under the POI H1', async () => {
  mockPoiFindMany.mockResolvedValue([{
    id: 'poi-1', name: 'Boucle du Prarion', slug: 'boucle-du-prarion', description: DESCRIPTION,
    address: 'Saint-Gervais', latitude: 45.89, longitude: 6.71, phone: null, website: 'https://www.prarion.example', rating: null,
    rating_count: 0, is_open_now: null, hours: null, photos: ['https://abcdefgh.supabase.co/storage/v1/object/public/guide-photos/admin/x.webp'], discovery_status: 'PUBLISHED',
    discovery_published_at: new Date('2026-08-20T12:00:00.000Z'), is_active: true, deleted_at: null,
    geocode_status: 'success', subcategory_id: null,
    city: { id: 'city-1', name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains', postal_code: '74170', department: 'Haute-Savoie', region: 'Auvergne-Rhône-Alpes', latitude: 45.89, longitude: 6.71, is_active: true, deleted_at: null },
    category: { id: 'category-1', name: 'Randonnées', slug: 'diner', icon: 'mountain', sort_order: 1, is_active: true, deleted_at: null },
    subcategory: null,
  }])
  const poi = await getDiscoveryPoi('saint-gervais-les-bains', 'diner', 'boucle-du-prarion')
  if (!poi) throw new Error('fixture invalide')

  render(<DiscoveryPoiView poi={poi} />)

  const markdown = screen.getByTestId('markdown')
  expect(markdown).toHaveTextContent(DESCRIPTION.replace(/\n/g, ' '))
  expect(markdown).toHaveAttribute('data-heading-level', '2')
  expect(markdown).toHaveAttribute('data-breaks', 'true')
})
