/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PublicMenu } from '@/features/city-guide/components/PublicMenu'

jest.mock('next/navigation', () => ({
  usePathname: () => '/guide/saint-gervais-les-bains',
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className, onClick }: {
    href: string
    children: React.ReactNode
    className?: string
    onClick?: () => void
  }) => (
    <a href={href} className={className} onClick={onClick}>{children}</a>
  ),
}))

describe('PublicMenu — weather link', () => {
  it('shows city-specific links in the burger menu when a guide city is known', async () => {
    render(<PublicMenu mode="anonymous" />)

    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))

    expect(screen.getByRole('link', { name: 'Logements' })).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains/logements',
    )
    expect(screen.getByRole('link', { name: 'Météo' })).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains/meteo',
    )
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains/contact',
    )
  })
})
