/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CityCategoryExplorer } from '@/features/city-guide/components/CityCategoryExplorer'

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

const CITIES = [
  { name: 'Chamonix-Mont-Blanc', slug: 'chamonix-mont-blanc' },
  { name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' },
]

const CATEGORIES = [
  { id: '1', name: 'Boulangerie', slug: 'boulangerie', icon: 'coffee', sort_order: 0, poi_count: 4 },
  { id: '2', name: 'Mobilité', slug: 'mobilite', icon: 'car', sort_order: 9, poi_count: 6 },
]

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: CATEGORIES }),
  }) as jest.Mock
})

afterEach(() => jest.clearAllMocks())

describe('CityCategoryExplorer', () => {
  it('shows the placeholder and lists active cities when opened', async () => {
    const user = userEvent.setup()
    render(<CityCategoryExplorer cities={CITIES} />)

    expect(screen.getByText('Sélectionner une ville')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Sélectionner une ville/i }))

    expect(screen.getByRole('option', { name: 'Chamonix-Mont-Blanc' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Saint-Gervais-les-Bains' })).toBeInTheDocument()
  })

  it('fetches and renders categories of the selected city', async () => {
    const user = userEvent.setup()
    render(<CityCategoryExplorer cities={CITIES} />)

    await user.click(screen.getByRole('button', { name: /Sélectionner une ville/i }))
    await user.click(screen.getByRole('option', { name: 'Saint-Gervais-les-Bains' }))

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/cities/saint-gervais-les-bains/categories',
      ),
    )
    expect(await screen.findByText('Boulangerie')).toBeInTheDocument()
    expect(screen.getByText('Mobilité')).toBeInTheDocument()
  })

  it('uses a photo for a mapped slug and a fallback (icon, no img) for an unmapped slug', async () => {
    const user = userEvent.setup()
    render(<CityCategoryExplorer cities={CITIES} />)

    await user.click(screen.getByRole('button', { name: /Sélectionner une ville/i }))
    await user.click(screen.getByRole('option', { name: 'Saint-Gervais-les-Bains' }))

    expect(await screen.findByAltText('Boulangerie')).toBeInTheDocument()
    expect(screen.queryByAltText('Mobilité')).not.toBeInTheDocument()
    expect(screen.getByText('Mobilité')).toBeInTheDocument()
  })

  it('links each category card to its guide route', async () => {
    const user = userEvent.setup()
    render(<CityCategoryExplorer cities={CITIES} />)

    await user.click(screen.getByRole('button', { name: /Sélectionner une ville/i }))
    await user.click(screen.getByRole('option', { name: 'Saint-Gervais-les-Bains' }))

    await screen.findByText('Boulangerie')
    expect(screen.getByText('Boulangerie').closest('a')).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains/boulangerie',
    )
  })
})
