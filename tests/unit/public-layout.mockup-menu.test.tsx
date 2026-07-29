/**
 * 001 mockup contract — public header exposes the burger menu overlay.
 * @jest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PublicLayout from '@/app/(public)/layout'

jest.mock('next/headers', () => ({
  headers: jest.fn(async () => new Headers()),
}))

jest.mock('@vercel/analytics/react', () => ({
  Analytics: () => null,
}))

jest.mock('@vercel/speed-insights/next', () => ({
  SpeedInsights: () => null,
}))

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn(async () => ({
    lodgingId: 'lodging-1',
    lodgingName: 'Chalet MyStay',
    citySlug: 'saint-gervais',
    cityName: 'Saint-Gervais-les-Bains',
    ownerName: 'Alice Martin',
  })),
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

describe('PublicLayout mockup menu', () => {
  it('opens the full-screen navigation overlay from the burger button', async () => {
    render(await PublicLayout({ children: <div>Contenu</div> }))

    expect(screen.queryByText('Navigation')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Coup de coeur/i })).toBeInTheDocument()
    expect(screen.queryByText('Vos favoris')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))

    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Vos favoris' })).toHaveAttribute(
      'href',
      '/guide/saint-gervais/mes-favoris',
    )
    expect(screen.getByRole('link', { name: 'Tous nos logements' })).toHaveAttribute(
      'href',
      '/guide/saint-gervais/logements',
    )
    expect(
      within(screen.getByTestId('public-menu-overlay')).getByRole('link', {
        name: 'Bienvenue',
      }),
    ).toHaveAttribute('href', '/nos-recommandations')
  })

  it('keeps the menu overlay constrained to the mobile app shell width', async () => {
    render(await PublicLayout({ children: <div>Contenu</div> }))

    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))

    expect(screen.getByTestId('public-menu-overlay')).toHaveClass(
      'left-1/2',
      'w-full',
      'max-w-[430px]',
      '-translate-x-1/2',
    )
  })

  it('keeps the burger menu anchored on the right side of the public header', async () => {
    render(await PublicLayout({ children: <div>Contenu</div> }))

    expect(screen.getByTestId('public-header-menu-slot')).toHaveClass('ml-auto')
  })

  it('renders the public header with a transparent blurred surface', async () => {
    render(await PublicLayout({ children: <div>Contenu</div> }))

    expect(screen.getByTestId('public-header')).toHaveClass(
      'bg-white/70',
      'backdrop-blur-xl',
    )
  })
})
