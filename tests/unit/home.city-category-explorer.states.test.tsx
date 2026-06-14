/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CityCategoryExplorer } from '@/features/city-guide/components/CityCategoryExplorer'

jest.mock('next/navigation', () => ({ useSearchParams: () => ({ get: () => null }) }))
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion')
  return { ...actual, useReducedMotion: () => true }
})

const CITIES = [{ name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' }]

afterEach(() => jest.clearAllMocks())

it('shows an empty message when the city has no category', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) }) as jest.Mock
  const user = userEvent.setup()
  render(<CityCategoryExplorer cities={CITIES} />)

  await user.click(screen.getByRole('button', { name: /Sélectionner une ville/i }))
  await user.click(screen.getByRole('option', { name: 'Saint-Gervais-les-Bains' }))

  expect(await screen.findByText(/Aucune catégorie disponible/i)).toBeInTheDocument()
})

it('shows an error message when the fetch fails', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false }) as jest.Mock
  const user = userEvent.setup()
  render(<CityCategoryExplorer cities={CITIES} />)

  await user.click(screen.getByRole('button', { name: /Sélectionner une ville/i }))
  await user.click(screen.getByRole('option', { name: 'Saint-Gervais-les-Bains' }))

  expect(await screen.findByText(/Impossible de charger les catégories/i)).toBeInTheDocument()
})

it('still renders categories under reduced motion', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: [{ id: '1', name: 'Boulangerie', slug: 'boulangerie', icon: 'coffee', sort_order: 0, poi_count: 4 }] }),
  }) as jest.Mock
  const user = userEvent.setup()
  render(<CityCategoryExplorer cities={CITIES} />)

  await user.click(screen.getByRole('button', { name: /Sélectionner une ville/i }))
  await user.click(screen.getByRole('option', { name: 'Saint-Gervais-les-Bains' }))

  expect(await screen.findByText('Boulangerie')).toBeInTheDocument()
})
