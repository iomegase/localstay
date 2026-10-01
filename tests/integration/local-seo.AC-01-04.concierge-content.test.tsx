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

  it('uses the new guide block title and the /concept guide visual', async () => {
    await renderConcierge()

    const heading = screen.getByRole('heading', { name: 'Moins de questions, plus de bons avis.' })
    const guideSection = heading.closest('section')!
    const showcase = within(guideSection).getByTestId('guide-phone-showcase')
    expect(within(showcase).getByRole('img', { name: /guide/i })).toHaveAttribute('src', expect.stringContaining('telephone-demo-trim.png'))
    expect(showcase).toHaveTextContent('Équipe MyStay')
    expect(showcase).toHaveTextContent('Prépare et accompagne le séjour')
    expect(showcase).toHaveTextContent('Voyageur')
    expect(showcase).toHaveTextContent('Profite pleinement du séjour')
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

  it('applies the PO layout tweaks (hero, H1 serif, arrows, guide pills, dark local section)', async () => {
    await renderConcierge()

    expect(screen.getByTestId('local-concierge-hero')).not.toHaveClass('bg-slate-50')
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent('Conciergerie à Saint-Gervais-les-Bains')
    const cityLine = within(h1).getByText('à Saint-Gervais-les-Bains')
    expect(cityLine).toHaveClass('font-serif', 'italic', 'whitespace-nowrap')

    const contact = within(screen.getByTestId('local-concierge-hero')).getByRole('link', { name: 'Nous contacter' })
    expect(contact.querySelector('svg')).toBeNull()
    expect(contact).toHaveClass('self-start')
    const allLodgings = screen.getByRole('link', { name: 'Voir les logements' })
    expect(allLodgings).toHaveTextContent(/^Voir les logements$/)

    const guide = screen.getByRole('heading', { name: 'Moins de questions, plus de bons avis.' }).closest('section')!
    expect(within(guide).queryByRole('link', { name: 'Découvrir le concept MyStay' })).not.toBeInTheDocument()
    const pills = within(guide).getAllByTestId('guide-benefit-pill')
    expect(pills.map(pill => pill.textContent)).toEqual(['Arrivée plus fluide', 'Informations toujours accessibles'])
    pills.forEach(pill => expect(pill).toHaveClass('rounded-full'))

    const local = screen.getByTestId('local-concierge-place')
    expect(local).toHaveClass('bg-slate-800', 'text-white')
  })

  it('never promises an owner area', async () => {
    const { container } = await renderConcierge()

    expect(container.textContent).not.toMatch(/espace propriétaire/i)
  })
})
