/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PublicMenu } from '@/features/city-guide/components/PublicMenu'

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
  it('shows a Météo link when a citySlug is known', async () => {
    render(<PublicMenu mode="anonymous" citySlug="saint-gervais-les-bains" />)

    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))

    expect(screen.getByRole('link', { name: 'Météo' })).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains/meteo',
    )
  })
})
