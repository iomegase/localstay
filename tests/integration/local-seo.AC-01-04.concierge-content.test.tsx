/** @jest-environment jsdom */

import { render, screen, within } from '@testing-library/react'
import { getPublishedLocalLanding } from '@/features/local-seo/queries/landing-pages'
import { publicLocalLanding } from '../fixtures/public-local-landing'

jest.mock('@/features/local-seo/queries/landing-pages', () => ({ getPublishedLocalLanding: jest.fn() }))
jest.mock('@/features/local-seo/queries/landing-reviews', () => ({
  listPublicLandingReviews: jest.fn().mockResolvedValue([]),
}))
jest.mock('@/features/lodging-showcase/queries/public-lodgings', () => ({
  listPublishedLodgings: jest.fn().mockResolvedValue([
    {
      id: 'lodging-1', slug: 'chalet-test', city_slug: 'saint-gervais-les-bains',
      city_name: 'Saint-Gervais-les-Bains', title: 'Chalet Test',
      cover_photo_url: '/demo/chalet.webp', short_description: 'Un chalet publié.',
      property_type: 'Chalet', max_guests: 6, bedroom_count: 3, bathroom_count: 2,
      surface_m2: 110, public_area_label: 'saint gervais les bains', amenities: [],
      href: '/logements/chalet-test', external_booking_url: null, external_booking_platform: null,
    },
  ]),
}))

import ConciergeCityPage from '@/app/(public)/conciergerie/[city-slug]/page'

const city = { id: 'city-1', name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' }

async function renderConcierge() {
  const landing = publicLocalLanding('CONCIERGE', city)
  landing.page.cta_label = 'Nous contacter'
  jest.mocked(getPublishedLocalLanding).mockResolvedValue(landing)
  return render(await ConciergeCityPage({ params: Promise.resolve({ 'city-slug': city.slug }) }))
}

describe('046 AC-01-04 — concierge landing content', () => {
  it('shows managed lodgings with the compact seminar cards and the City name', async () => {
    await renderConcierge()

    const card = screen.getByRole('link', { name: 'Découvrir Chalet Test' })
    expect(card).toHaveAttribute('href', '/logements/chalet-test')
    expect(within(card).getByText('Saint-Gervais-les-Bains')).toBeInTheDocument()
    expect(within(card).queryByText('saint gervais les bains')).not.toBeInTheDocument()
    expect(card).toHaveTextContent('110 m²')
    expect(card).toHaveTextContent('6')
  })

  it('uses the new guide block title', async () => {
    await renderConcierge()

    expect(screen.getByRole('heading', { name: 'Moins de questions, plus de bons avis.' })).toBeInTheDocument()
  })

  it('ends with a single « Nous contacter » button and the no-commitment promise', async () => {
    await renderConcierge()

    const heading = screen.getByRole('heading', { name: 'Vous avez un logement à Saint-Gervais-les-Bains ?' })
    const finalBlock = heading.closest('section')!
    const links = within(finalBlock).getAllByRole('link')
    expect(links.map(link => link.textContent?.trim())).toEqual(['Nous contacter'])
    expect(links[0]).toHaveClass('whitespace-nowrap')
    expect(links[0].parentElement).toHaveClass('shrink-0')
    expect(finalBlock).toHaveTextContent('Parlons de votre logement et de ce que vous souhaitez déléguer. Premier échange sans engagement.')
    expect(finalBlock).not.toHaveTextContent('Premier échange personnalisé')
  })

  it('lays the FAQ out on two columns', async () => {
    await renderConcierge()

    expect(screen.getByTestId('marketing-faq-items')).toHaveClass('md:grid-cols-2')
  })

  it('never promises an owner area', async () => {
    const { container } = await renderConcierge()

    expect(container.textContent).not.toMatch(/espace propriétaire/i)
  })
})
