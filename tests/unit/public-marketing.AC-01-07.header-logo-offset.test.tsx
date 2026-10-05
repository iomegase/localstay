/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { MarketingHeader } from '@/features/marketing/components/MarketingHeader'

describe('031 AC-01-07 — header logo offset on desktop', () => {
  it('shifts the header logo ~30px left and up from lg only', () => {
    render(<MarketingHeader />)

    const brand = screen.getByTestId('marketing-header-brand')
    expect(brand).toHaveClass('lg:-translate-x-[30px]', 'lg:-translate-y-[30px]')
    expect(brand.className).not.toMatch(/(^|\s)-?translate-[xy]-/)
    expect(brand).toContainElement(screen.getByRole('link', { name: 'MyStay — Accueil' }))
    // Marge haute de 30 px sur desktop pour que le logo ne soit pas collé au bord.
    expect(screen.getByRole('banner')).toHaveClass('lg:mt-[30px]')
  })
})
