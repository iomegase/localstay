/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { GuideHeader } from '@/features/guide-app/components/GuideHeader'

describe('GuideHeader approved brand', () => {
  it('renders the approved prominent monogram and keeps the city context', () => {
    render(
      <GuideHeader
        city="Saint-Gervais-les-Bains"
        onOpenHome={jest.fn()}
      />,
    )

    const logoSource = decodeURIComponent(
      screen.getByAltText('MyStay').getAttribute('src') ?? '',
    )
    expect(logoSource).toContain(
      '/mystay-logo-approved/mystay-logo-approved@4x.png',
    )
    expect(screen.getByRole('banner')).toHaveClass('h-[68px]')
    expect(screen.getByAltText('MyStay')).toHaveClass('h-7')
    expect(screen.getByText('Saint-Gervais-les-Bains')).toBeInTheDocument()
    expect(screen.queryByText('Démonstration')).not.toBeInTheDocument()
    expect(screen.getByTestId('guide-menu-icon')).toBeInTheDocument()
  })

  it('keeps the internal home action on the branded button', () => {
    const onOpenHome = jest.fn()
    render(
      <GuideHeader
        city="Saint-Gervais-les-Bains"
        onOpenHome={onOpenHome}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Accueil du guide' }))
    expect(onOpenHome).toHaveBeenCalledTimes(1)
  })
})
