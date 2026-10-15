/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { publicLocalLanding } from '../fixtures/public-local-landing'
import { LocalVacationRentalLanding } from '@/features/local-seo/components/LocalVacationRentalLanding'
import type { MarketingLodgingCard } from '@/features/lodging-showcase/queries/public-lodgings'
import { publicDiscoveryCityPath } from '@/features/public-discovery/lib/public-paths'

jest.mock('next/navigation', () => ({
  usePathname: () => '/locations-vacances/saint-gervais-les-bains',
}))

const landing = publicLocalLanding('VACATION_RENTAL', {
  id: 'city-1', name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains',
})

const lodging: MarketingLodgingCard = {
  id: 'profile-1',
  slug: 'chalet-hygge',
  city_slug: 'saint-gervais-les-bains',
  city_name: 'Saint-Gervais-les-Bains',
  title: 'Le Chalet Hygge',
  cover_photo_url: 'https://images.example/chalet.webp',
  short_description: 'Un chalet chaleureux face aux montagnes.',
  property_type: 'Chalet',
  max_guests: 6,
  bedroom_count: 3,
  bathroom_count: 2,
  surface_m2: 110,
  public_area_label: 'Saint-Gervais-les-Bains',
  amenities: ['Wi-Fi'],
  href: '/logements/chalet-hygge',
  external_booking_url: 'https://www.airbnb.fr/rooms/123',
  external_booking_platform: 'airbnb',
}

const apartment: MarketingLodgingCard = {
  ...lodging,
  id: 'profile-2',
  slug: 'hauts-saint-gervais',
  title: 'Les Hauts de Saint-Gervais',
  property_type: 'Appartement',
  max_guests: 4,
  surface_m2: null,
  bathroom_count: null,
  href: '/logements/hauts-saint-gervais',
  external_booking_url: null,
  external_booking_platform: null,
}

const third: MarketingLodgingCard = { ...apartment, id: 'profile-3', slug: 'studio-bettex', title: 'Studio du Bettex', max_guests: 2, href: '/logements/studio-bettex' }

describe('046 AC-03-06 / AC-03-10 — hero facts line', () => {
  it('derives the facts line from published lodgings from 3 lodgings on', () => {
    render(<LocalVacationRentalLanding landing={landing} lodgings={[lodging, apartment, third]} />)

    expect(screen.getByTestId('vacation-facts')).toHaveTextContent('3 logements · de 2 à 6 voyageurs')
    expect(screen.queryByRole('navigation', { name: 'Sur cette page' })).not.toBeInTheDocument()
  })

  it('hides the facts line below 3 lodgings', () => {
    render(<LocalVacationRentalLanding landing={landing} lodgings={[lodging, apartment]} />)
    expect(screen.queryByTestId('vacation-facts')).not.toBeInTheDocument()
  })

  it('renders no facts line without lodging', () => {
    render(<LocalVacationRentalLanding landing={landing} lodgings={[]} />)
    expect(screen.queryByTestId('vacation-facts')).not.toBeInTheDocument()
  })
})

describe('046 AC-03-07 — dedicated local lodging card', () => {
  it('renders eyebrow type, 2x2 stats grid, main link and availability CTA, without Airbnb CTA or repeated city', () => {
    render(<LocalVacationRentalLanding landing={landing} lodgings={[lodging, apartment]} />)

    const section = screen.getByRole('region', { name: /Notre accompagnement/ })
    expect(section).toHaveAttribute('id', 'logements')
    expect(within(section).queryByText('2 logements')).not.toBeInTheDocument()

    const cards = within(section).getAllByRole('article')
    expect(cards).toHaveLength(2)
    const chalet = cards[0]
    expect(within(chalet).getByText('Chalet')).toBeInTheDocument()
    expect(within(chalet).getByRole('link', { name: 'Découvrir Le Chalet Hygge' })).toHaveAttribute('href', '/logements/chalet-hygge')
    expect(within(chalet).queryByRole('link', { name: 'Voir sur Airbnb' })).not.toBeInTheDocument()
    // AC-03-11 : vrai bouton « Voir les disponibilités » vers la même fiche.
    expect(within(chalet).getByRole('link', { name: 'Voir les disponibilités — Le Chalet Hygge' })).toHaveAttribute('href', '/logements/chalet-hygge')
    expect(within(chalet).getAllByRole('link')).toHaveLength(2)
    const stat = (card: HTMLElement, label: string) =>
      within(card).getByText(label, { selector: 'dt' }).nextElementSibling
    expect(stat(chalet, 'Surface')).toHaveTextContent('110 m²')
    expect(stat(chalet, 'Voyageurs')).toHaveTextContent('6')
    expect(stat(chalet, 'Chambres')).toHaveTextContent('3')
    expect(stat(chalet, 'Salles de bain')).toHaveTextContent('2')
    expect(within(chalet).queryByText('Saint-Gervais-les-Bains')).not.toBeInTheDocument()

    const flat = cards[1]
    expect(within(flat).queryByRole('link', { name: 'Voir sur Airbnb' })).not.toBeInTheDocument()
    expect(stat(flat, 'Surface')).toHaveTextContent('—')
    expect(stat(flat, 'Salles de bain')).toHaveTextContent('—')
  })
})

describe('046 AC-03-08 — editorial sections', () => {
  it('renders destination, highlights, steps and FAQ, without a final CTA block', () => {
    const { container } = render(<LocalVacationRentalLanding landing={landing} lodgings={[lodging]} />)

    const destination = container.querySelector<HTMLElement>('#destination')!
    expect(destination).toHaveTextContent('Sur place')
    expect(destination).toHaveTextContent(landing.page.local_title)
    expect(destination).toHaveTextContent(landing.page.local_copy)
    expect(within(destination).getByRole('link', { name: 'Découvrir Saint-Gervais-les-Bains' }))
      .toHaveAttribute('href', publicDiscoveryCityPath('saint-gervais-les-bains'))
    expect(destination).toHaveTextContent('Notre fonctionnement')
    expect(within(destination).getByRole('heading', { name: landing.page.process_title! })).toBeInTheDocument()
    expect(within(destination).getByRole('heading', { name: landing.page.steps[0].title })).toBeInTheDocument()
    expect(within(destination).getByText('01')).toBeInTheDocument()
    expect(within(destination).queryByRole('heading', { name: landing.page.highlights[0].title })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: landing.page.highlights[0].title })).toBeInTheDocument()
    expect(container.querySelector('#faq details summary')).toHaveTextContent(landing.page.faq[0].question)
    // Amendement du 2026-10-13 : le bloc final « [City] vous attend. » est retiré.
    expect(screen.queryByText('Saint-Gervais-les-Bains vous attend.')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: landing.page.cta_label })).not.toBeInTheDocument()
  })

  it('AC-03-12: renders the city discovery link as a light outline button', () => {
    const { container } = render(<LocalVacationRentalLanding landing={landing} lodgings={[lodging]} />)
    const destination = container.querySelector<HTMLElement>('#destination')!
    expect(within(destination).getByRole('link', { name: 'Découvrir Saint-Gervais-les-Bains' })).toHaveClass('rounded-full', 'border-white/40')
  })

  it('keeps the highlights spaced from the footer when there is no FAQ', () => {
    const highlights = (root: HTMLElement) => within(root).getByRole('heading', { name: 'Séjourner avec MyStay à Saint-Gervais-les-Bains' }).closest('section')!
    const withFaq = render(<LocalVacationRentalLanding landing={landing} lodgings={[lodging]} />)
    // La FAQ apporte déjà l'espace bas de la page.
    expect(highlights(withFaq.container)).not.toHaveClass('pb-16')
    withFaq.unmount()

    const noFaq = { ...landing, page: { ...landing.page, faq: [] } }
    const { container } = render(<LocalVacationRentalLanding landing={noFaq} lodgings={[lodging]} />)
    expect(highlights(container)).toHaveClass('pb-16', 'sm:pb-24')
  })

  it('keeps the empty state content and links, without listing CTA or final question block', () => {
    render(<LocalVacationRentalLanding landing={landing} lodgings={[]} />)
    expect(screen.getByText(landing.page.empty_copy!)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Découvrir la région' })).toHaveAttribute('href', '/decouvrir')
    expect(screen.queryByRole('link', { name: 'Voir les logements' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Poser une question' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Une question sur le logement ?' })).not.toBeInTheDocument()
  })
})

describe('046 AC-03-09 / AC-03-13 — booking-oriented CTAs', () => {
  it('AC-03-09: shows « Voir les logements » and « Poser une question » in the hero', () => {
    render(<LocalVacationRentalLanding landing={landing} lodgings={[lodging, apartment]} />)
    expect(screen.getByRole('link', { name: 'Voir les logements' })).toHaveAttribute('href', '#logements')
    fireEvent.click(screen.getByRole('button', { name: 'Poser une question' }))
    const dialog = screen.getByRole('dialog', { name: 'Nous écrire' })
    expect(within(dialog).getByRole('form', { name: 'Message voyageur' })).toBeInTheDocument()
    const select = within(dialog).getByLabelText(/Logement concerné/)
    expect(within(select).getAllByRole('option').map(option => option.textContent)).toEqual([
      'Pas encore choisi', 'Le Chalet Hygge', 'Les Hauts de Saint-Gervais',
    ])
  })

  it('AC-03-13: ends with « Une question sur le logement ? » opening the traveler form', () => {
    render(<LocalVacationRentalLanding landing={landing} lodgings={[lodging]} />)
    const block = screen.getByRole('region', { name: 'Une question sur le logement ?' })
    fireEvent.click(within(block).getByRole('button', { name: 'Nous écrire' }))
    expect(screen.getByRole('form', { name: 'Message voyageur' })).toBeInTheDocument()
  })
})
