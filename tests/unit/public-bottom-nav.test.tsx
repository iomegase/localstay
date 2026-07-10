/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react'

const mockUsePathname = jest.fn()
const mockUseUserLocation = jest.fn()

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
    'aria-label': ariaLabel,
  }: {
    href: string
    children: React.ReactNode
    className?: string
    'aria-label'?: string
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>{children}</a>
  ),
}))

jest.mock('@/features/geolocation/hooks/useUserLocation', () => ({
  useUserLocation: () => mockUseUserLocation(),
}))

import { PublicBottomNav } from '@/features/city-guide/components/PublicBottomNav'

describe('PublicBottomNav', () => {
  beforeEach(() => {
    mockUsePathname.mockReset()
    mockUseUserLocation.mockReturnValue({
      location: null,
      status: 'idle',
      requestLocation: jest.fn(),
      clearLocation: jest.fn(),
      dismiss: jest.fn(),
    })
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('hides the guide button on the anonymous public home page', () => {
    mockUsePathname.mockReturnValue('/')

    render(<PublicBottomNav mode="anonymous" citySlug={null} />)

    const homeLink = screen.getByRole('link', { name: /Coup de coeur/i })
    expect(homeLink).toHaveAttribute('href', '/')
    // Le cœur n'est plus rouge plein : il suit la couleur de l'item.
    expect(homeLink.querySelector('svg')).not.toHaveClass('fill-red-500')
    expect(screen.queryByRole('link', { name: /Guide/i })).not.toBeInTheDocument()
  })

  it('shows a guide button on guide routes that links back to the city guide root', () => {
    mockUsePathname.mockReturnValue('/guide/saint-gervais-les-bains/restaurants')

    render(<PublicBottomNav mode="anonymous" citySlug={null} />)

    expect(screen.getByRole('link', { name: /Guide/i })).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains',
    )
    expect(screen.queryByRole('link', { name: /Vos favoris/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Blog/i })).toHaveAttribute(
      'href',
      '/blog',
    )
    expect(screen.getByRole('link', { name: /Coup de coeur/i })).toHaveAttribute('href', '/')
  })

  it('keeps the guide context on contextual contact pages while exposing the global blog link', () => {
    mockUsePathname.mockReturnValue('/guide/saint-gervais-les-bains/contact')

    render(<PublicBottomNav mode="anonymous" citySlug={null} />)

    expect(screen.getByRole('link', { name: /Guide/i })).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains',
    )
    expect(screen.queryByRole('link', { name: /Vos favoris/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Blog/i })).toHaveAttribute(
      'href',
      '/blog',
    )
  })

  it('does not render the redundant city guide link in lodging mode', () => {
    mockUsePathname.mockReturnValue('/le-logement')

    render(<PublicBottomNav mode="lodging" citySlug="saint-gervais-les-bains" />)

    expect(screen.queryByRole('link', { name: /^Guide$/i })).not.toBeInTheDocument()
  })

  it('renders the lodging guide label on the lodging bottom nav', () => {
    mockUsePathname.mockReturnValue('/le-logement')

    render(<PublicBottomNav mode="lodging" citySlug="saint-gervais-les-bains" />)

    expect(screen.getByRole('link', { name: /Guide logement/i })).toHaveAttribute(
      'href',
      '/le-logement',
    )
    // Item actif = pilule sombre slate-800 à texte blanc.
    const activeLink = screen.getByRole('link', { name: /Guide logement/i })
    expect(activeLink).toHaveClass('bg-slate-800')
    expect(activeLink).toHaveClass('text-white')
  })

  it('keeps inactive items readable over the glass bottom menu', () => {
    mockUsePathname.mockReturnValue('/guide/saint-gervais-les-bains')

    render(<PublicBottomNav mode="lodging" citySlug="saint-gervais-les-bains" />)

    const inactiveLink = screen.getByRole('link', { name: /Coup de coeur/i })
    expect(inactiveLink).toHaveClass('text-[#6f7480]')
    expect(inactiveLink).toHaveClass('hover:text-[#4b5563]')
    expect(inactiveLink).not.toHaveClass('hover:text-pink-600')
    expect(inactiveLink).not.toHaveClass('bg-slate-800')
  })

  it('colors the GPS nav item red by default, orange while loading and green when active', () => {
    mockUsePathname.mockReturnValue('/guide/saint-gervais-les-bains')

    const { rerender } = render(<PublicBottomNav mode="lodging" citySlug="saint-gervais-les-bains" />)
    expect(screen.getByRole('button', { name: /Activer la géolocalisation/i })).toHaveClass('text-red-500')

    mockUseUserLocation.mockReturnValue({
      location: null,
      status: 'loading',
      requestLocation: jest.fn(),
      clearLocation: jest.fn(),
      dismiss: jest.fn(),
    })
    rerender(<PublicBottomNav mode="lodging" citySlug="saint-gervais-les-bains" />)
    expect(screen.getByRole('button', { name: /Activer la géolocalisation/i })).toHaveClass('text-orange-500')

    mockUseUserLocation.mockReturnValue({
      location: { latitude: 45.892, longitude: 6.713 },
      status: 'ready',
      requestLocation: jest.fn(),
      clearLocation: jest.fn(),
      dismiss: jest.fn(),
    })
    rerender(<PublicBottomNav mode="lodging" citySlug="saint-gervais-les-bains" />)
    expect(screen.getByRole('button', { name: /Désactiver la géolocalisation/i })).toHaveClass('text-green-600')
  })

  it('stays visible on the fullscreen map page (no immersive-hide)', () => {
    mockUsePathname.mockReturnValue('/map')

    render(<PublicBottomNav mode="lodging" citySlug="saint-gervais-les-bains" />)

    expect(screen.getByTestId('public-bottom-nav')).not.toHaveClass('immersive-hide')
  })

  it('keeps immersive-hide on other immersive views (e.g. lodging guide)', () => {
    mockUsePathname.mockReturnValue('/le-logement')

    render(<PublicBottomNav mode="lodging" citySlug="saint-gervais-les-bains" />)

    expect(screen.getByTestId('public-bottom-nav')).toHaveClass('immersive-hide')
  })

  it('makes the bottom menu surface transparent only while the user is scrolling', () => {
    jest.useFakeTimers()
    mockUsePathname.mockReturnValue('/guide/saint-gervais-les-bains')

    render(<PublicBottomNav mode="lodging" citySlug="saint-gervais-les-bains" />)

    const nav = screen.getByTestId('public-bottom-nav')
    const surface = screen.getByTestId('public-bottom-nav-surface')
    expect(nav).toHaveClass('opacity-100')
    expect(surface).toHaveClass('bg-white')

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 64,
    })
    fireEvent.scroll(window)

    expect(nav).toHaveClass('opacity-0')
    expect(nav).toHaveClass('pointer-events-none')
    expect(surface).toHaveClass('bg-transparent')
    expect(surface).toHaveClass('shadow-none')
    expect(surface).not.toHaveClass('bg-white')

    act(() => {
      jest.advanceTimersByTime(120)
    })
    expect(surface).toHaveClass('bg-transparent')

    fireEvent.scroll(window)
    act(() => {
      jest.advanceTimersByTime(220)
    })

    expect(nav).toHaveClass('opacity-100')
    expect(nav).not.toHaveClass('pointer-events-none')
    expect(surface).toHaveClass('bg-white')
    expect(surface).toHaveClass('shadow-xl')
    expect(surface).not.toHaveClass('bg-transparent')
  })
})
