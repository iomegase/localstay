/**
 * 001 mockup contract — public header exposes the burger menu overlay.
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PublicLayout from '@/app/(public)/layout'

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
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

describe('PublicLayout mockup menu', () => {
  it('opens the full-screen navigation overlay from the burger button', async () => {
    render(await PublicLayout({ children: <div>Contenu</div> }))

    expect(screen.queryByText('Navigation')).not.toBeInTheDocument()
    expect(screen.getByText('Bienvenue')).toBeInTheDocument()
    expect(screen.getByText('Vos favoris')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))

    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.getByText('Le Logement')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Logements' })).toHaveAttribute(
      'href',
      '/guide/saint-gervais/logements',
    )
    expect(screen.getByRole('link', { name: 'Les recommandations de Alice Martin' })).toHaveAttribute(
      'href',
      '/nos-recommandations',
    )
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
})
