/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { publicLocalLanding } from '../fixtures/public-local-landing'
import { getPublishedLocalLanding } from '@/features/local-seo/queries/landing-pages'

jest.mock('@/features/local-seo/queries/landing-pages', () => ({ getPublishedLocalLanding: jest.fn() }))

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

jest.mock('@/features/lodging-showcase/queries/public-lodgings', () => ({
  listPublishedLodgings: jest.fn().mockResolvedValue([]),
}))

jest.mock('@/features/local-seo/queries/landing-reviews', () => ({
  listPublicLandingReviews: jest.fn().mockResolvedValue([]),
}))

import ConciergeCityPage, {
  generateMetadata as generateConciergeMetadata,
} from '@/app/(public)/conciergerie/[city-slug]/page'
import SeminarCityPage from '@/app/(public)/seminaires/[city-slug]/page'

describe('046 local SEO service pages', () => {
  beforeEach(() => { jest.mocked(getPublishedLocalLanding).mockReset() })

  it('renders the active Saint-Gervais concierge page and its MyStay CTA', async () => {
    jest.mocked(getPublishedLocalLanding).mockResolvedValue(publicLocalLanding('CONCIERGE', {
      id: 'city-1', name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains',
    }))
    const page = await ConciergeCityPage({
      params: Promise.resolve({ 'city-slug': 'saint-gervais-les-bains' }),
    })
    const { container } = render(page)

    expect(screen.getByRole('heading', {
      level: 1,
      name: 'Conciergerie à Saint-Gervais-les-Bains',
    })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Confier mon logement' })[0]).toHaveAttribute(
      'href',
      '/confier-mon-logement',
    )
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(screen.getByText('Conciergerie locale')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Vous avez un logement à Saint-Gervais-les-Bains ?' })).toBeInTheDocument()
    expect(container.innerHTML).not.toContain('font-serif')
    expect(container.innerHTML).not.toContain('scale(')
    expect(container.querySelector('script[type="application/ld+json"]')).not.toBeNull()
  })

  it('renders a unique active seminar page with the approved email CTA', async () => {
    jest.mocked(getPublishedLocalLanding).mockResolvedValue(publicLocalLanding('SEMINAR', {
      id: 'city-2', name: 'Saint-Nicolas-de-Véroce', slug: 'saint-nicolas-de-veroce',
    }))
    const page = await SeminarCityPage({
      params: Promise.resolve({ 'city-slug': 'saint-nicolas-de-veroce' }),
    })
    render(page)

    expect(screen.getByRole('heading', {
      level: 1,
      name: 'Séminaire à Saint-Nicolas-de-Véroce',
    })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Parler de mon séminaire' })[0]).toHaveAttribute(
      'href',
      expect.stringMatching(/^mailto:bonjour@mystay\.city/),
    )
    expect(screen.getByRole('heading', { name: 'Préparons votre séminaire à Saint-Nicolas-de-Véroce.' })).toBeInTheDocument()
  })

  it.each(['megeve', 'combloux', 'destination-inconnue'])(
    'rejects an unpublished concierge destination: %s',
    async slug => {
      jest.mocked(getPublishedLocalLanding).mockResolvedValue(null)
      await expect(ConciergeCityPage({
        params: Promise.resolve({ 'city-slug': slug }),
      })).rejects.toThrow('NEXT_NOT_FOUND')
    },
  )

  it('returns noindex metadata for an unpublished service destination', async () => {
    jest.mocked(getPublishedLocalLanding).mockResolvedValue(null)
    await expect(generateConciergeMetadata({
      params: Promise.resolve({ 'city-slug': 'megeve' }),
    })).resolves.toEqual(expect.objectContaining({
      robots: expect.objectContaining({ index: false, follow: false }),
    }))
  })
})
