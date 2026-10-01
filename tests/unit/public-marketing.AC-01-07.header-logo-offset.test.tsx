/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { MarketingHeader } from '@/features/marketing/components/MarketingHeader'

jest.mock('@/features/guide-demo/components/GuideDemoPhoneButton', () => ({
  GuideDemoPhoneButton: () => null,
}))

describe('031 AC-01-07 — header logo offset on desktop', () => {
  it('shifts the header logo ~30px left and up from lg only', () => {
    render(<MarketingHeader />)

    const brand = screen.getByTestId('marketing-header-brand')
    expect(brand).toHaveClass('lg:-translate-x-[30px]', 'lg:-translate-y-[30px]')
    expect(brand.className).not.toMatch(/(^|\s)-?translate-[xy]-/)
    expect(brand).toContainElement(screen.getByRole('link', { name: 'MyStay — Accueil' }))
  })
})
