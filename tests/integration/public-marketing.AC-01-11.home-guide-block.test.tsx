/** @jest-environment jsdom */

import { render, screen, within } from '@testing-library/react'
import { MarketingHome } from '@/features/marketing/components/MarketingHome'

describe('031 AC-01-11 — « Le guide MyStay » block on the home', () => {
  it('replaces « Ce qui distingue MyStay » with the concierge guide block and the phone visual', () => {
    render(<MarketingHome lodgings={[]} />)

    expect(screen.queryByRole('heading', { name: /Une conciergerie prolongée par le digital/ })).not.toBeInTheDocument()
    const section = screen.getByRole('heading', { level: 2, name: 'Moins de questions, plus de bons avis.' }).closest('section')!
    expect(section).toHaveTextContent('Le guide MyStay')
    expect(section).toHaveTextContent('Chaque logement a son guide personnalisé')
    // Pastilles et visuel cliquable : voir AC-01-12 (2).
    expect(within(section).getByTestId('guide-phone-showcase')).toBeInTheDocument()
    expect(within(section).queryByRole('link', { name: /concept/i })).not.toBeInTheDocument()
  })
})
