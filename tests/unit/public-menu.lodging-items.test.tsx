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

describe('PublicMenu — mode séjour', () => {
  it('does not list a recommendations entry (the home already shows it)', async () => {
    render(<PublicMenu mode="lodging" ownerName="Alice Martin" lodgingName="Chalet Rémy" citySlug="saint-gervais" />)

    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))

    expect(screen.getByText('Bienvenue')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /recommandations/i })).not.toBeInTheDocument()
  })
})
