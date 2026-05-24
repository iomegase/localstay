/**
 * 001 mockup contract — public header exposes the burger menu overlay.
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PublicLayout from '@/app/(public)/layout'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

describe('PublicLayout mockup menu', () => {
  it('opens the full-screen navigation overlay from the burger button', async () => {
    render(<PublicLayout><div>Contenu</div></PublicLayout>)

    expect(screen.queryByText('Navigation')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))

    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.getByText('Le Logement')).toBeInTheDocument()
    expect(screen.getByText('Services Privés')).toBeInTheDocument()
  })
})
