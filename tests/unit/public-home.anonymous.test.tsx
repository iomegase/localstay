/**
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
    ownerName: 'Alice',
  })),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: { findMany: jest.fn() },
    lodgingCustomization: { findFirst: jest.fn() },
    lodgingPublicProfile: { findMany: jest.fn(async () => []) },
  },
}))

jest.mock('next/navigation', () => ({ useSearchParams: () => ({ get: () => null }) }))
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

it('root always renders the public marketing site even with an active lodging cookie', async () => {
  ;(prisma.city.findMany as jest.Mock).mockResolvedValue([
    { name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' },
  ])

  render(await HomePage())

  expect(screen.getByRole('heading', { level: 1, name: /Votre logement, géré avec soin/i })).toBeInTheDocument()
  expect(screen.queryByText('Sélectionner une ville')).not.toBeInTheDocument()
})
