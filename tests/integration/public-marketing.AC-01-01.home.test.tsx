/** @jest-environment jsdom */

import { render, screen, within } from '@testing-library/react'
import { MarketingHome } from '@/features/marketing/components/MarketingHome'
import type { MarketingLodgingCard } from '@/features/lodging-showcase/queries/public-lodgings'

const lodging: MarketingLodgingCard = {
  id: 'lodging-1',
  slug: 'chalet-hygge',
  href: '/guide/chamonix/logements/chalet-hygge',
  title: 'Le Chalet Hygge',
  short_description: 'Un chalet chaleureux.',
  public_area_label: 'Saint-Gervais-les-Bains',
  city_name: 'Saint-Gervais-les-Bains',
  cover_photo_url: '/marketing/hero-chalet-v2.png',
  max_guests: 6,
  bedroom_count: 3,
  bathroom_count: 2,
  surface_m2: 110,
}

describe('031-public-marketing-site home', () => {
  it('renders the approved editorial hero and core sections without an invitation gate', () => {
    render(<MarketingHome lodgings={[]} />)

    expect(screen.getByRole('heading', { level: 1, name: /Votre logement, géré avec soin/i })).toBeInTheDocument()
    expect(screen.queryByText('Accès sur invitation')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Votre bien mérite plus qu’une simple remise de clés/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Une gestion attentive, avant, pendant et après chaque séjour/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Le guide MyStay prolonge notre accueil/i })).toBeInTheDocument()
    expect(screen.getByText(/Aucun logement public n’est encore disponible/i)).toBeInTheDocument()

    expect(screen.getByTestId('editorial-hero-shell')).toHaveClass(
      'xl:max-w-[944px]',
    )
    expect(screen.getByTestId('editorial-hero')).toHaveClass(
      'bg-white',
      'min-h-[560px]',
    )
    expect(screen.getByTestId('editorial-hero').querySelector('img')).not.toBeInTheDocument()
    expect(screen.getByTestId('editorial-hero-content')).toHaveClass(
      'text-slate-800',
      'min-h-[560px]',
      'xl:px-[52px]',
      'xl:pb-[43px]',
      'xl:pt-[60px]',
    )
    expect(screen.getByTestId('editorial-intro-copy')).toHaveClass(
      'xl:max-w-[744px]',
      'xl:px-6',
    )
    const highlightGrid = screen.getByTestId('editorial-highlight-grid')
    expect(highlightGrid).toHaveClass(
      'grid-cols-1',
      'sm:grid-cols-2',
      'lg:grid-cols-3',
      'xl:grid-cols-5',
    )
    const featuredHighlight = screen.getByTestId('editorial-highlight-0')
    expect(featuredHighlight).toHaveClass(
      'group',
      'bg-[#ffffff]',
      'min-h-[165px]',
    )
    expect(featuredHighlight).toHaveTextContent('01')
    expect(featuredHighlight.querySelector('svg')).not.toBeInTheDocument()
    expect(
      screen
        .getAllByRole('link', { name: /Notre approche/i })
        .some(link => link.classList.contains('bg-pink-600')),
    ).toBe(true)
    expect(screen.getByTestId('editorial-services')).toHaveClass(
      'xl:pb-[42px]',
      'xl:pt-[82px]',
    )
    expect(screen.getByTestId('editorial-service-01')).toHaveClass(
      'group',
      'bg-[#f8f7f5]',
      'min-h-[165px]',
    )
    expect(within(screen.getByTestId('editorial-service-01')).getByText('01')).toHaveClass('text-[100px]')
    expect(screen.getByTestId('editorial-process')).toHaveClass(
      'xl:pb-[88px]',
      'xl:pt-8',
    )
    expect(screen.getByTestId('editorial-process-card-0')).toHaveClass(
      'group',
      'bg-[#f8f7f5]',
      'min-h-[165px]',
    )
    expect(screen.getByTestId('editorial-process-card-0')).toHaveTextContent('01')
    expect(screen.getByTestId('editorial-process-card-0').querySelector('svg')).not.toBeInTheDocument()
    expect(screen.getByTestId('editorial-cta')).toHaveClass(
      'xl:gap-16',
      'xl:rounded-[24px]',
      'xl:px-[52px]',
      'xl:py-[53px]',
    )
  })

  it('eagerly loads lodging photos shown on the home page', () => {
    const { container } = render(<MarketingHome lodgings={[lodging]} />)
    const lodgingImage = container.querySelector(
      'a[aria-label="Découvrir Le Chalet Hygge"] img'
    )

    expect(lodgingImage).not.toHaveAttribute('loading', 'lazy')
  })
})
