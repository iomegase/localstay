/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { ActionButtons } from '@/features/categories/components/ActionButtons'

const base = {
  phone: '+33 4 50 78 24 90',
  website: 'https://bistrot-mont-blanc.fr',
  latitude: 45.8921,
  longitude: 6.7085,
  poiName: 'Le Bistrot du Mont-Blanc',
  poiUrl: '/guide/saint-gervais-les-bains/restaurants/restaurants-gastro-demo',
}

describe('ActionButtons — AC-01-02 (phone) + AC-01-03 (website)', () => {
  it('renders Appeler button with tel: link when phone is present', () => {
    render(<ActionButtons {...base} />)
    const callLink = screen.getByTestId('btn-call')
    expect(callLink).toBeInTheDocument()
    expect(callLink).toHaveAttribute('href', 'tel:+33450782490')
  })

  it('does NOT render Appeler button when phone is null', () => {
    render(<ActionButtons {...base} phone={null} />)
    expect(screen.queryByTestId('btn-call')).not.toBeInTheDocument()
  })

  it('renders Site button linking to website when present', () => {
    render(<ActionButtons {...base} />)
    const siteLink = screen.getByTestId('btn-site')
    expect(siteLink).toHaveAttribute('href', 'https://bistrot-mont-blanc.fr')
    expect(siteLink).toHaveAttribute('target', '_blank')
  })

  it('does NOT render Site button when website is null', () => {
    render(<ActionButtons {...base} website={null} />)
    expect(screen.queryByTestId('btn-site')).not.toBeInTheDocument()
  })

  it('always renders Itinéraire button', () => {
    render(<ActionButtons {...base} />)
    expect(screen.getByTestId('btn-directions')).toBeInTheDocument()
  })

  it('always renders disabled Réserver button', () => {
    render(<ActionButtons {...base} />)
    const reserveBtn = screen.getByTestId('btn-reserve')
    expect(reserveBtn).toBeInTheDocument()
    expect(reserveBtn).toBeDisabled()
  })
})
