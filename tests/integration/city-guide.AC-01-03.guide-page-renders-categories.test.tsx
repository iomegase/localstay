/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import type { CityGuide } from '@/features/city-guide/types'

const mockNotFound = jest.fn()
jest.mock('next/navigation', () => ({ notFound: () => mockNotFound() }))
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))
jest.mock('@/features/city-guide/queries/cities', () => ({
  getCityGuide: jest.fn(),
}))
jest.mock('@/features/analytics/lib/record-qr-scan', () => ({
  recordQrScanIfPresent: jest.fn().mockResolvedValue(undefined),
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

    expect(screen.getByText('Saint-Gervais-les-Bains')).toBeInTheDocument()
    expect(screen.getByText('Restaurants')).toBeInTheDocument()
    expect(screen.getByText('Randonnées')).toBeInTheDocument()
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
