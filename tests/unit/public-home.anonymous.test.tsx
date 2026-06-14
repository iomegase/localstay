/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import HomePage from '@/app/(public)/page'
import { prisma } from '@/shared/lib/prisma'

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn(async () => null),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: { city: { findMany: jest.fn() }, lodgingCustomization: { findFirst: jest.fn() } },
}))

jest.mock('next/navigation', () => ({ useSearchParams: () => ({ get: () => null }) }))
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

it('anonymous home renders the title and the city selector', async () => {
  ;(prisma.city.findMany as jest.Mock).mockResolvedValue([
    { name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' },
  ])

  render(await HomePage())

  expect(screen.getByText("Trouvez ce qu'il vous faut.")).toBeInTheDocument()
  expect(screen.getByText('Sélectionner une ville')).toBeInTheDocument()
})
