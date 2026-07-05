/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { act, fireEvent } from '@testing-library/react'
import { ActionButtons } from '@/features/categories/components/ActionButtons'

const base = {
  phone: '+33 4 50 78 24 90',
  website: 'https://bistrot-mont-blanc.fr',
  latitude: 45.8921,
  longitude: 6.7085,
  address: "25 Place de l'Église, Saint-Nicolas de Véroce, 74170 Saint-Gervais-les-Bains",
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

  it('uses the public POI address for Google Maps directions before falling back to coordinates', () => {
    render(<ActionButtons {...base} />)
    const href = screen.getByTestId('btn-directions').getAttribute('href') ?? ''

    expect(href).toContain('google.com/maps/dir')
    expect(href).toContain('destination=25%20Place%20de%20l%27%C3%89glise')
    expect(href).not.toContain('destination=45.8921,6.7085')
  })

  it('does not render Réserver until reservation is enabled by a dedicated spec', () => {
    render(<ActionButtons {...base} />)
    expect(screen.queryByTestId('btn-reserve')).not.toBeInTheDocument()
  })

  it('renders favorite modal footer actions with the public bottom nav visual style', () => {
    render(<ActionButtons {...base} variant="modalFooter" />)

    expect(screen.getByTestId('favorite-modal-footer-actions')).toHaveClass('fixed', 'bottom-8', 'left-1/2', 'grid', 'grid-cols-3', 'rounded-full', 'border-black/5', 'shadow-xl')
    expect(screen.getByTestId('btn-call')).toHaveClass('flex-col', 'items-center', 'gap-1', 'text-[#6f7480]', 'hover:text-pink-600')
    expect(screen.getByTestId('btn-site')).toHaveClass('flex-col', 'items-center', 'gap-1', 'text-[#6f7480]', 'hover:text-pink-600')
    expect(screen.getByTestId('btn-directions')).toHaveClass('flex-col', 'items-center', 'gap-1', 'text-[#6f7480]', 'hover:text-pink-600')
    expect(screen.getByText('Appeler')).toHaveClass('text-[9px]', 'font-bold', 'uppercase', 'tracking-widest')
    expect(screen.getByText('Site')).toHaveClass('text-[9px]', 'font-bold', 'uppercase', 'tracking-widest')
    expect(screen.getByText('Itinéraire')).toHaveClass('text-[9px]', 'font-bold', 'uppercase', 'tracking-widest')
    expect(screen.queryByText('Téléphone')).not.toBeInTheDocument()
    expect(screen.queryByText('Web')).not.toBeInTheDocument()
    expect(screen.queryByText('Maps')).not.toBeInTheDocument()
    expect(screen.queryByTestId('btn-reserve')).not.toBeInTheDocument()
  })

  it('hides the fixed favorite modal footer while scrolling and restores it when scrolling stops', () => {
    jest.useFakeTimers()
    render(<ActionButtons {...base} variant="modalFooter" />)

    const footer = screen.getByTestId('favorite-modal-footer-actions')
    expect(footer).toHaveClass('opacity-100', 'translate-y-0')

    act(() => {
      fireEvent.scroll(window)
    })
    expect(footer).toHaveClass('opacity-0', 'pointer-events-none', 'translate-y-4')

    act(() => {
      jest.advanceTimersByTime(180)
    })
    expect(footer).toHaveClass('opacity-100', 'translate-y-0')

    jest.useRealTimers()
  })
})
