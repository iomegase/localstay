/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CityCategoryExplorer } from '@/features/city-guide/components/CityCategoryExplorer'

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: (k: string) => (k === 'lodging' ? 'lodge-1' : null) }),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

const CITIES = [{ name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' }]
const CATEGORIES = [
  { id: '1', name: 'Boulangerie', slug: 'boulangerie', icon: 'coffee', sort_order: 0, poi_count: 4 },
]

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: CATEGORIES }) }) as jest.Mock
})
afterEach(() => jest.clearAllMocks())

it('propagates ?lodging= to the fetch URL and category links', async () => {
  const user = userEvent.setup()
  render(<CityCategoryExplorer cities={CITIES} />)

  await user.click(screen.getByRole('button', { name: /Sélectionner une ville/i }))
  await user.click(screen.getByRole('option', { name: 'Saint-Gervais-les-Bains' }))

  await waitFor(() =>
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/cities/saint-gervais-les-bains/categories?lodging=lodge-1',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    ),
  )
  await screen.findByText('Boulangerie')
  expect(screen.getByText('Boulangerie').closest('a')).toHaveAttribute(
    'href',
    '/guide/saint-gervais-les-bains/boulangerie?lodging=lodge-1',
  )
})
