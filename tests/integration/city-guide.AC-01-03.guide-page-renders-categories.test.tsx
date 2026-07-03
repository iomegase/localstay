/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import type { CityGuide } from '@/features/city-guide/types'

const mockNotFound = jest.fn()
jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/guide/saint-gervais-les-bains',
}))
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))
jest.mock('@/features/city-guide/queries/cities', () => ({
  getCityGuide: jest.fn(),
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
// react-markdown est ESM → on stubbe MarkdownText (importé via la liste « Tous » → PoiCard).
jest.mock('@/shared/components/MarkdownText', () => ({
  MarkdownText: ({ source }: { source?: string | null }) => <div>{source}</div>,
}))

import { getCityGuide } from '@/features/city-guide/queries/cities'
import GuidePage from '@/app/(public)/guide/[city-slug]/page'

const mockGuide: CityGuide = {
  city: {
    id: 'city-1',
    name: 'Saint-Gervais-les-Bains',
    slug: 'saint-gervais-les-bains',
    postal_code: '74170',
    department: 'Haute-Savoie',
  },
  categories: [
    { id: 'cat-1', name: 'Restaurants', slug: 'restaurants', icon: 'utensils', sort_order: 1, poi_count: 5 },
    { id: 'cat-2', name: 'Randonnées', slug: 'randonnees', icon: 'mountain', sort_order: 2, poi_count: 3 },
  ],
}

describe('GuidePage (AC-01-03)', () => {
  beforeEach(() => mockNotFound.mockClear())

  it('AC-01-03: displays city name and available categories', async () => {
    ;(getCityGuide as jest.Mock).mockResolvedValue(mockGuide)
    const jsx = await GuidePage({ params: { 'city-slug': 'saint-gervais-les-bains' } })
    render(jsx)

    // L'en-tête affiche désormais « Le guide » (le nom de ville a été retiré du design).
    expect(screen.getAllByText('Restaurants').length).toBeGreaterThan(0)
    expect(screen.getByText('Randonnées')).toBeInTheDocument()
  })

  it('AC-03-03: follows the 001 home mockup structure', async () => {
    ;(getCityGuide as jest.Mock).mockResolvedValue(mockGuide)
    const jsx = await GuidePage({ params: { 'city-slug': 'saint-gervais-les-bains' } })
    render(jsx)

    // Recherche désactivée temporairement (commentée dans la page).
    expect(screen.queryByPlaceholderText('Une envie particulière ?')).not.toBeInTheDocument()
    expect(screen.queryByTestId('category-grid')).not.toBeInTheDocument()
    expect(screen.getByTestId('category-row')).toHaveClass('overflow-x-auto')
  })

  it('AC-01-02: calls notFound() when slug does not exist in DB', async () => {
    ;(getCityGuide as jest.Mock).mockResolvedValue(null)
    await GuidePage({ params: { 'city-slug': 'nonexistent' } })
    expect(mockNotFound).toHaveBeenCalledTimes(1)
  })

  it('AC-03-04: shows empty state message when city has no active POIs', async () => {
    ;(getCityGuide as jest.Mock).mockResolvedValue({ ...mockGuide, categories: [] })
    const jsx = await GuidePage({ params: { 'city-slug': 'saint-gervais-les-bains' } })
    render(jsx)

    expect(
      screen.getByText('Aucun contenu disponible pour cette ville pour le moment')
    ).toBeInTheDocument()
  })
})
