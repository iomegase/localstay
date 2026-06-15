/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react'

const mockUsePathname = jest.fn()

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

import { PublicBottomNav } from '@/features/city-guide/components/PublicBottomNav'

describe('PublicBottomNav', () => {
  beforeEach(() => {
    mockUsePathname.mockReset()
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

    expect(screen.getByRole('link', { name: /Bienvenue/i })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('link', { name: /Guide/i })).not.toBeInTheDocument()
  })

  it('shows a guide button on guide routes that links back to the city guide root', () => {
    mockUsePathname.mockReturnValue('/guide/saint-gervais-les-bains/restaurants')

    render(<PublicBottomNav mode="anonymous" citySlug={null} />)

    expect(screen.getByRole('link', { name: /Guide/i })).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains',
    )
    expect(screen.getByRole('link', { name: /Vos favoris/i })).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains/mes-favoris',
    )
    expect(screen.getByRole('link', { name: /Blog/i })).toHaveAttribute(
      'href',
      '/blog',
    )
    expect(screen.getByRole('link', { name: /Bienvenue/i })).toHaveAttribute('href', '/')
  })

  it('keeps the guide context on contextual contact pages while exposing the global blog link', () => {
    mockUsePathname.mockReturnValue('/guide/saint-gervais-les-bains/contact')

    render(<PublicBottomNav mode="anonymous" citySlug={null} />)

    expect(screen.getByRole('link', { name: /Guide/i })).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains',
    )
    expect(screen.getByRole('link', { name: /Vos favoris/i })).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains/mes-favoris',
    )
    expect(screen.getByRole('link', { name: /Blog/i })).toHaveAttribute(
      'href',
      '/blog',
    )
  })

  it('highlights the selected item with the approved gold color', () => {
    mockUsePathname.mockReturnValue('/guide/saint-gervais-les-bains')

    render(<PublicBottomNav mode="lodging" citySlug="saint-gervais-les-bains" />)

    expect(screen.getByRole('link', { name: /Guide/i })).toHaveClass('text-[#bd9254]')
  })

  it('keeps inactive items readable over the glass bottom menu', () => {
    mockUsePathname.mockReturnValue('/guide/saint-gervais-les-bains')

    render(<PublicBottomNav mode="lodging" citySlug="saint-gervais-les-bains" />)

    const inactiveLink = screen.getByRole('link', { name: /Bienvenue/i })
    expect(inactiveLink).toHaveClass('text-[#6f7480]')
    expect(inactiveLink).not.toHaveClass('text-gray-300')
  })

  it('makes the bottom menu surface transparent only while the user is scrolling', () => {
    jest.useFakeTimers()
    mockUsePathname.mockReturnValue('/guide/saint-gervais-les-bains')

    render(<PublicBottomNav mode="lodging" citySlug="saint-gervais-les-bains" />)

    const nav = screen.getByTestId('public-bottom-nav')
    const surface = screen.getByTestId('public-bottom-nav-surface')
    expect(nav).toHaveClass('opacity-100')
    expect(surface).toHaveClass('glass')

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 64,
    })
    fireEvent.scroll(window)

    expect(nav).toHaveClass('opacity-0')
    expect(nav).toHaveClass('pointer-events-none')
    expect(surface).toHaveClass('bg-transparent')
    expect(surface).toHaveClass('shadow-none')
    expect(surface).not.toHaveClass('glass')

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
    expect(surface).toHaveClass('glass')
    expect(surface).toHaveClass('shadow-xl')
    expect(surface).not.toHaveClass('bg-transparent')
  })
})
