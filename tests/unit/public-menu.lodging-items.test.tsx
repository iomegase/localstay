/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PublicMenu } from '@/features/city-guide/components/PublicMenu'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

jest.mock('next/navigation', () => ({
  usePathname: () => '/guide/saint-gervais',
}))

async function openLodgingMenu() {
  render(<PublicMenu mode="lodging" ownerName="Alice Martin" lodgingName="Chalet Rémy" citySlug="saint-gervais" />)
  await userEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
}

describe('PublicMenu — mode séjour', () => {
  it('lists Favorites, Tous nos logements, Agenda, Blog and Contact', async () => {
    await openLodgingMenu()

    expect(screen.getByRole('link', { name: /vos favoris/i })).toHaveAttribute('href', '/guide/saint-gervais/mes-favoris')
    expect(screen.getByRole('link', { name: /tous nos logements/i })).toHaveAttribute('href', '/guide/saint-gervais/logements')
    expect(screen.getByRole('link', { name: /agenda/i })).toHaveAttribute('href', '/guide/saint-gervais/agenda')
    expect(screen.getByRole('link', { name: /blog/i })).toHaveAttribute('href', '/blog')
    expect(screen.getByRole('link', { name: /contacter/i })).toBeInTheDocument()
  })

  it('does not list a Météo entry', async () => {
    await openLodgingMenu()
    expect(screen.queryByRole('link', { name: /météo/i })).not.toBeInTheDocument()
  })

  it('links the current-stay name to the private stay home', async () => {
    await openLodgingMenu()
    expect(screen.getByRole('link', { name: /chalet rémy/i })).toHaveAttribute(
      'href',
      '/nos-recommandations',
    )
  })
})
