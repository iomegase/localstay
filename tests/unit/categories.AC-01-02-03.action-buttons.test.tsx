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

  it('renders POI detail actions with the POI card-inspired pill button design', () => {
    render(<ActionButtons {...base} />)

    expect(screen.getByTestId('btn-call')).toHaveClass(
      'min-h-[42px]',
      'min-w-0',
      'w-full',
      'col-start-1',
      'rounded-full',
      'bg-white',
      'text-[9px]',
      'shadow-[0_7px_16px_rgba(17,24,39,0.07)]',
    )
    expect(screen.getByTestId('btn-call')).toHaveTextContent('Appeler')
    expect(screen.getByTestId('btn-call')).not.toHaveTextContent('+33 4 50 78 24 90')
    expect(screen.getByTestId('btn-call').querySelector('span')).toHaveClass('bg-[#31B95D]')

    expect(screen.getByTestId('btn-directions')).toHaveClass(
      'min-h-[42px]',
      'min-w-0',
      'w-full',
      'col-start-2',
      'rounded-full',
      'bg-white',
      'text-[9px]',
      'shadow-[0_7px_16px_rgba(17,24,39,0.07)]',
    )
    expect(screen.getByTestId('btn-directions')).toHaveTextContent('Itinéraire')
    expect(screen.getByTestId('btn-directions')).not.toHaveTextContent('GPS')
    expect(screen.getByTestId('btn-directions').querySelector('span')).toHaveClass('bg-[#EF5148]')

    expect(screen.getByTestId('btn-site')).toHaveClass(
      'min-h-[42px]',
      'min-w-0',
      'w-full',
      'col-start-3',
      'rounded-full',
      'bg-white',
      'text-[9px]',
      'shadow-[0_7px_16px_rgba(17,24,39,0.07)]',
    )
    expect(screen.getByTestId('btn-site')).toHaveTextContent('Site web')
    expect(screen.getByTestId('btn-site')).not.toHaveTextContent('Voir le site')
    expect(screen.getByTestId('btn-site').querySelector('span')).toHaveClass('bg-[#218F9D]')
  })

  it('keeps the three-column action layout when only itinerary is visible', () => {
    const { container } = render(<ActionButtons {...base} phone={null} website={null} />)

    const actionGrid = container.firstElementChild
    expect(actionGrid).toHaveClass('grid', 'grid-cols-3')
    expect(screen.getByTestId('btn-directions')).toHaveClass('col-start-2', 'w-full')
    expect(screen.getByTestId('btn-directions')).not.toHaveClass('flex-1')
    expect(screen.queryByTestId('btn-call')).not.toBeInTheDocument()
    expect(screen.queryByTestId('btn-site')).not.toBeInTheDocument()
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

  it('renders favorite modal footer actions with the POI card-inspired pill design', () => {
    render(<ActionButtons {...base} variant="modalFooter" />)

    expect(screen.getByTestId('favorite-modal-footer-actions')).toHaveClass('fixed', 'bottom-8', 'left-1/2', 'grid', 'grid-cols-3', 'gap-2')
    expect(screen.getByTestId('btn-call')).toHaveClass('min-h-[42px]', 'w-full', 'col-start-1', 'rounded-full', 'bg-white', 'text-[9px]')
    expect(screen.getByTestId('btn-site')).toHaveClass('min-h-[42px]', 'w-full', 'col-start-3', 'rounded-full', 'bg-white', 'text-[9px]')
    expect(screen.getByTestId('btn-directions')).toHaveClass('min-h-[42px]', 'w-full', 'col-start-2', 'rounded-full', 'bg-white', 'text-[9px]')
    expect(screen.getByTestId('btn-call').querySelector('span')).toHaveClass('bg-[#31B95D]')
    expect(screen.getByTestId('btn-site').querySelector('span')).toHaveClass('bg-[#218F9D]')
    expect(screen.getByTestId('btn-directions').querySelector('span')).toHaveClass('bg-[#EF5148]')
    expect(screen.getByText('Appeler')).toHaveClass('text-[#31B95D]')
    expect(screen.getByText('Site web')).toHaveClass('text-[#218F9D]')
    expect(screen.getByText('Itinéraire')).toHaveClass('text-[#EF5148]')
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
