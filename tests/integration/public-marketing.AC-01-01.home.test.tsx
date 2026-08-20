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
      'xl:min-h-[560px]',
      'xl:rounded-[26px]',
    )
    expect(screen.getByTestId('editorial-hero-content')).toHaveClass(
      'xl:min-h-[560px]',
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
      'min-[761px]:grid-cols-2',
      'min-[1051px]:grid-cols-[1.05fr_repeat(2,minmax(0,0.78fr))]',
      'xl:mt-[88px]',
      'xl:gap-[14px]',
      'xl:grid-rows-[repeat(2,minmax(205px,auto))]',
    )
    expect(highlightGrid).not.toHaveClass('grid-cols-2', 'lg:grid-cols-3')
    const featuredHighlight = screen.getByTestId('editorial-highlight-0')
    expect(featuredHighlight).toHaveClass(
      'flex',
      'bg-[radial-gradient(circle_at_100%_0,rgba(219,39,119,0.055),transparent_34%)]',
      'bg-[#f7f6f4]',
      'xl:min-h-[205px]',
      'xl:rounded-[22px]',
      'xl:px-6',
      'xl:py-[22px]',
      'min-[761px]:col-span-2',
      'min-[1051px]:col-span-1',
      'min-[1051px]:col-start-1',
      'min-[1051px]:row-start-1',
    )
    expect(featuredHighlight.querySelector('svg')).toBeInTheDocument()
    expect(screen.getByTestId('editorial-highlight-4')).not.toHaveClass('col-span-2')
    const approachAction = screen.getByRole('link', { name: /Comprendre notre approche/i })
      .parentElement
    expect(approachAction).toHaveClass(
      'flex',
      'col-span-1',
      'min-[761px]:col-span-2',
      'min-[1051px]:col-span-1',
      'min-[1051px]:col-start-1',
      'min-[1051px]:row-start-2',
    )
    expect(approachAction).not.toHaveClass('hidden', 'lg:flex')
    expect(screen.getByTestId('editorial-services')).toHaveClass(
      'xl:pb-[42px]',
      'xl:pt-[82px]',
    )
    expect(screen.getByTestId('editorial-service-01')).toHaveClass(
      'flex',
      'bg-[radial-gradient(circle_at_100%_0,rgba(219,39,119,0.055),transparent_34%)]',
      'bg-[#f7f6f4]',
      'xl:min-h-[198px]',
      'xl:rounded-[20px]',
      'xl:px-6',
      'xl:pb-6',
      'xl:pt-[27px]',
    )
    expect(within(screen.getByTestId('editorial-service-01')).getByText('01')).toHaveClass(
      'text-[44px]',
      'tracking-[-0.07em]',
    )
    expect(screen.getByTestId('editorial-process')).toHaveClass(
      'xl:pb-[88px]',
      'xl:pt-8',
    )
    expect(screen.getByTestId('editorial-process-card-0')).toHaveClass(
      'flex',
      'bg-[radial-gradient(circle_at_100%_0,rgba(219,39,119,0.055),transparent_34%)]',
      'bg-[#f7f6f4]',
      'xl:min-h-[234px]',
      'xl:rounded-[22px]',
      'xl:px-6',
      'xl:pb-6',
      'xl:pt-[26px]',
    )
    expect(screen.getByTestId('editorial-process-card-0').querySelector('svg')).toBeInTheDocument()
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
