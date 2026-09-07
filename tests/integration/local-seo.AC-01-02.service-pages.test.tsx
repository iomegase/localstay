/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

import ConciergeCityPage, {
  generateMetadata as generateConciergeMetadata,
} from '@/app/(public)/conciergerie/[city-slug]/page'
import SeminarCityPage from '@/app/(public)/seminaires/[city-slug]/page'

describe('046 local SEO service pages', () => {
  it('renders the active Saint-Gervais concierge page and its MyStay CTA', async () => {
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
    expect(container.innerHTML).not.toContain('font-serif')
    expect(container.innerHTML).not.toContain('scale(')
    expect(container.querySelector('script[type="application/ld+json"]')).not.toBeNull()
  })

  it('renders a unique active seminar page with the approved email CTA', async () => {
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
  })

  it.each(['megeve', 'combloux', 'destination-inconnue'])(
    'rejects an unpublished concierge destination: %s',
    async slug => {
      await expect(ConciergeCityPage({
        params: Promise.resolve({ 'city-slug': slug }),
      })).rejects.toThrow('NEXT_NOT_FOUND')
    },
  )

  it('returns noindex metadata for an unpublished service destination', async () => {
    await expect(generateConciergeMetadata({
      params: Promise.resolve({ 'city-slug': 'megeve' }),
    })).resolves.toEqual(expect.objectContaining({
      robots: expect.objectContaining({ index: false, follow: false }),
    }))
  })
})
