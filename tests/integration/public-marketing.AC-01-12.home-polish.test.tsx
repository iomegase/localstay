/** @jest-environment jsdom */

import { render, screen, within } from '@testing-library/react'
import { MarketingHome } from '@/features/marketing/components/MarketingHome'

describe('031 AC-01-12 — home polish', () => {
  it('(1) keeps only « Nous contacter » in the hero', () => {
    render(<MarketingHome lodgings={[]} />)

    const hero = screen.getByTestId('editorial-hero')
    expect(within(hero).queryByRole('link', { name: 'Découvrir MyStay' })).not.toBeInTheDocument()
    expect(within(hero).getAllByRole('link').map(link => link.textContent)).toEqual(['Nous contacter'])
  })

  it('(2) shows two guide pills and a static guide screenshot, without any demo trigger', () => {
    render(<MarketingHome lodgings={[]} />)

    const section = screen.getByRole('heading', { level: 2, name: 'Moins de questions, plus de bons avis.' }).closest('section')!
    const pills = within(section).getAllByTestId('guide-benefit-pill')
    expect(pills.map(pill => pill.textContent)).toEqual(['Arrivée plus fluide', 'Informations toujours accessibles'])
    pills.forEach(pill => expect(pill).toHaveClass('rounded-full'))
    expect(within(section).queryByTestId('home-guide-benefit')).not.toBeInTheDocument()
    expect(within(section).queryByRole('button', { name: /Voir le guide d’exemple/ })).not.toBeInTheDocument()

    // Spec 045 dépréciée (2026-10-05) : la démo interactive est remplacée par une capture.
    expect(within(section).queryByRole('button', { name: 'Ouvrir le guide d’exemple' })).not.toBeInTheDocument()
    const showcase = within(section).getByTestId('guide-phone-showcase')
    expect(within(showcase).getByRole('img', { name: 'Guide digital MyStay affiché sur un smartphone' })).toBeInTheDocument()
  })

  it('(3) vertically centres the one-column FAQ title', () => {
    render(<MarketingHome lodgings={[]} />)

    const faq = screen.getByTestId('marketing-faq-section')
    expect(faq.firstElementChild).toHaveClass('lg:items-center')
  })

  it('(4) titles the final block « Parlons de votre projet. »', () => {
    render(<MarketingHome lodgings={[]} />)

    const cta = screen.getByTestId('editorial-cta')
    expect(within(cta).getByRole('heading', { level: 2 })).toHaveTextContent(/^Parlons de votre projet\.$/)
  })
})
