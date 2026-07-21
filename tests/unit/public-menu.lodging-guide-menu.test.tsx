/**
 * @jest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PublicMenu } from '@/features/city-guide/components/PublicMenu'

let pathname = '/le-logement'

jest.mock('next/navigation', () => ({
  usePathname: () => pathname,
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, onClick, className }: {
    href: string
    children: React.ReactNode
    onClick?: () => void
    className?: string
  }) => <a href={href} onClick={onClick} className={className}>{children}</a>,
}))

describe('PublicMenu — guide du logement', () => {
  beforeEach(() => {
    pathname = '/le-logement'
  })

  it('opens the lodging section menu only on /le-logement', async () => {
    const user = userEvent.setup()
    render(<PublicMenu mode="lodging" lodgingName="Le 305" citySlug="saint-gervais" />)

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))

    const overlay = screen.getByTestId('public-menu-overlay')
    expect(within(overlay).getByText('MYSTAY')).toBeInTheDocument()
    expect(within(overlay).getByText('Guide du logement')).toBeInTheDocument()
    expect(within(overlay).getByRole('link', { name: 'Bienvenue' })).toHaveAttribute('href', '#bienvenue')
    expect(within(overlay).getByRole('link', { name: 'Infos pratiques' })).toHaveAttribute('href', '#infos-pratiques')
    expect(within(overlay).getByRole('link', { name: 'Bon à savoir' })).toHaveAttribute('href', '#bon-a-savoir')
    expect(within(overlay).getByRole('link', { name: 'Départ' })).toHaveAttribute('href', '#depart')
    expect(within(overlay).queryByText('Navigation')).not.toBeInTheDocument()
  })

  it('keeps the existing lodging navigation on other routes', async () => {
    pathname = '/'
    const user = userEvent.setup()
    render(<PublicMenu mode="lodging" lodgingName="Le 305" citySlug="saint-gervais" />)

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))

    const overlay = screen.getByTestId('public-menu-overlay')
    expect(within(overlay).getByText('Navigation')).toBeInTheDocument()
    expect(within(overlay).getByRole('link', { name: 'Vos favoris' })).toBeInTheDocument()
    expect(within(overlay).queryByText('Guide du logement')).not.toBeInTheDocument()
  })

  it('closes the lodging menu with Escape', async () => {
    const user = userEvent.setup()
    render(<PublicMenu mode="lodging" lodgingName="Le 305" citySlug="saint-gervais" />)

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    expect(screen.getByTestId('public-menu-overlay')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByTestId('public-menu-overlay')).not.toBeInTheDocument()
  })
})
