/** @jest-environment jsdom */

import { render, screen, within } from '@testing-library/react'
import { publicLocalLanding } from '../fixtures/public-local-landing'
import { LocalConciergeLanding } from '@/features/local-seo/components/LocalConciergeLanding'

jest.mock('next/navigation', () => ({
  usePathname: () => '/conciergerie/saint-gervais-les-bains',
}))

const base = publicLocalLanding('CONCIERGE', {
  id: 'city-1', name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains',
})

function renderHero(page: Partial<typeof base.page>) {
  render(<LocalConciergeLanding landing={{ ...base, page: { ...base.page, ...page } }} lodgings={[]} reviews={[]} />)
  return screen.getByTestId('local-concierge-hero')
}

describe('046 AC-01-12 — hero conciergerie calqué sur la home', () => {
  it('renders a single column: eyebrow-styled H1, bold lead then serif tail, copy, CTA and checked reassurance', () => {
    const hero = renderHero({
      hero_title: 'Confiez-nous votre logement. Nous organisons chaque séjour.',
      reassurance: 'Sans contrat d’exclusivité · Vous restez titulaire de votre annonce',
      eyebrow: 'Conciergerie locale',
    })

    expect(hero).toHaveClass('max-w-[760px]')
    expect(hero).not.toHaveClass('lg:grid')
    const h1 = within(hero).getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/^Conciergerie à Saint-Gervais-les-Bains$/)
    expect(within(hero).queryByText('Conciergerie locale')).not.toBeInTheDocument()

    const lead = within(hero).getByText('Confiez-nous votre logement.')
    expect(lead.closest('p')).toHaveClass('font-bold')
    expect(within(hero).getByText('Nous organisons chaque séjour.')).toHaveClass('font-serif', 'italic', 'text-[32px]')

    expect(within(hero).getByText(base.page.hero_copy)).toBeInTheDocument()
    expect(within(hero).getByRole('link', { name: base.page.cta_label })).toHaveAttribute('href', base.page.cta_href)
    const items = within(hero).getAllByRole('listitem')
    expect(items.map(item => item.textContent)).toEqual(['Sans contrat d’exclusivité', 'Vous restez titulaire de votre annonce'])
    for (const item of items) expect(item.querySelector('svg')).not.toBeNull()
  })

  it('keeps a one-sentence slogan entirely bold', () => {
    const hero = renderHero({ hero_title: 'Votre projet à Saint-Gervais-les-Bains', reassurance: null })
    expect(within(hero).getByText('Votre projet à Saint-Gervais-les-Bains')).not.toHaveClass('font-serif')
    expect(hero.querySelector('.font-serif')).toBeNull()
    expect(within(hero).queryByRole('list')).not.toBeInTheDocument()
  })
})

describe('046 AC-01-13 — titre du bloc final sur deux lignes', () => {
  it('breaks before the city and keeps the accessible heading text', () => {
    renderHero({})
    const heading = screen.getByRole('heading', { name: 'Vous avez un logement à Saint-Gervais-les-Bains ?' })
    expect(within(heading).getByText('Vous avez un logement à')).toHaveClass('block')
    expect(within(heading).getByTestId('concierge-final-city')).toHaveClass('block', 'sm:whitespace-nowrap')
  })
})
