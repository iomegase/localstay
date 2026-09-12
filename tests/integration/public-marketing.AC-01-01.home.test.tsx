/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { MarketingHome } from '@/features/marketing/components/MarketingHome'
import type { MarketingLodgingCard } from '@/features/lodging-showcase/queries/public-lodgings'

const lodging: MarketingLodgingCard = {
  id: 'lodging-1',
  slug: 'chalet-hygge',
  href: '/logements/chalet-hygge',
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

    expect(screen.getByRole('heading', { level: 1, name: /Votre logement,.*suivi localement.*Vos voyageurs,.*mieux accompagnés/i })).toBeInTheDocument()
    expect(screen.queryByText('Accès sur invitation')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Nous connaissons les logements que nous accompagnons/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Un accompagnement concret,.*avant, pendant et après chaque séjour/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Une conciergerie prolongée par le digital/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Coordination des séjours' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: 'Accueil voyageurs' })).toHaveLength(2)
    expect(screen.getByRole('heading', { name: 'Ménage & linge' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Intendance' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Guide digital MyStay' })).toBeInTheDocument()
    expect(screen.getByText(/Aucun logement public n’est encore disponible/i)).toBeInTheDocument()

    expect(screen.getByTestId('editorial-hero-shell')).toHaveClass(
      'xl:max-w-[944px]',
    )
    expect(screen.getByTestId('editorial-hero')).toHaveClass(
      'bg-white',
      'min-h-[580px]',
    )
    expect(screen.getByTestId('editorial-hero').querySelector('img')).not.toBeInTheDocument()
    expect(screen.getByTestId('editorial-hero-content')).toHaveClass(
      'text-slate-800',
      'min-h-[580px]',
      'xl:px-[52px]',
      'xl:pb-[48px]',
      'xl:pt-[64px]',
    )
    expect(screen.getAllByRole('link', { name: 'Confier mon logement' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Découvrir MyStay' })).toHaveAttribute('href', '/concept')
    expect(screen.getByTestId('editorial-process')).toHaveClass(
      'xl:pb-[96px]',
      'xl:pt-[72px]',
    )
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
