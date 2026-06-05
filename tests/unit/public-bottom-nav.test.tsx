/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'

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
    expect(screen.getByRole('link', { name: /Bienvenue/i })).toHaveAttribute('href', '/')
  })
})
