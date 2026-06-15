/**
 * 029-blog-editorial — AC-01-06
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

import { PublicBottomNav } from '@/features/city-guide/components/PublicBottomNav'

describe('029 blog public bottom nav', () => {
  it('replaces the anonymous Contact entry with Blog', () => {
    render(<PublicBottomNav mode="anonymous" citySlug={null} />)

    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog')
    expect(screen.queryByRole('link', { name: 'Contact' })).not.toBeInTheDocument()
  })
})
