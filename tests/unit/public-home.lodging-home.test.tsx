/**
 * 012 lodging home — public welcome page for a lodging stay.
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import HomePage from '@/app/(public)/page'
import { prisma } from '@/shared/lib/prisma'

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn(async () => ({
    lodgingId: 'lodging-1',
    lodgingName: 'Chalet MyStay',
    citySlug: 'saint-gervais',
    cityName: 'Saint-Gervais-les-Bains',
    ownerName: 'Alice Martin',
  })),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodgingCustomization: {
      findFirst: jest.fn(),
    },
  },
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

describe('Public lodging home', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders lodging photo, welcome message and CTA to the guide', async () => {
    ;(prisma.lodgingCustomization.findFirst as jest.Mock).mockResolvedValue({
      cover_photo_url: 'https://cdn.example.test/chalet.jpg',
      welcome_message: 'Bienvenue dans votre chalet.',
    })

    render(await HomePage())

    expect(screen.getByRole('img', { name: 'Chalet MyStay' })).toHaveAttribute(
      'src',
      'https://cdn.example.test/chalet.jpg',
    )
    expect(screen.getByText('Bienvenue dans votre chalet.', { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Découvrir le guide' })).toHaveAttribute(
      'href',
      '/guide/saint-gervais',
    )
    expect(screen.getByText('Les recommandations de Alice Martin')).toBeInTheDocument()
    expect(screen.getByText('Vos favoris')).toBeInTheDocument()
  })
})
