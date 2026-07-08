/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GuestMap, type GuestMapPoi } from '@/app/(public)/map/_components/GuestMap'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

jest.mock('react-map-gl/mapbox', () => {
  const React = jest.requireActual<typeof import('react')>('react')

  const MapMock = React.forwardRef(
    (
      { children, onLoad }: { children: React.ReactNode; onLoad?: () => void },
      ref: React.ForwardedRef<{ flyTo: jest.Mock; fitBounds: jest.Mock }>,
    ) => {
      React.useImperativeHandle(ref, () => ({
        flyTo: jest.fn(),
        fitBounds: jest.fn(),
      }))
      React.useEffect(() => {
        onLoad?.()
      }, [onLoad])

      return <div data-testid="mapbox-map">{children}</div>
    },
  )
  MapMock.displayName = 'MapMock'

  return {
    __esModule: true,
    default: MapMock,
    Source: ({ children }: { children: React.ReactNode }) => <div data-testid="map-source">{children}</div>,
    Layer: ({ id }: { id: string }) => <div data-testid={`map-layer-${id}`} />,
    Marker: ({ children }: { children: React.ReactNode }) => <div data-testid="map-marker">{children}</div>,
    NavigationControl: () => <div data-testid="navigation-control" />,
  }
})

function poi(overrides: Partial<GuestMapPoi> & Pick<GuestMapPoi, 'id' | 'name' | 'categoryName' | 'categorySlug' | 'categoryIcon' | 'categoryColor'>): GuestMapPoi {
  return {
    slug: overrides.id,
    latitude: 45.89,
    longitude: 6.7,
    photo_url: null,
    rating: null,
    owner_note: null,
    citySlug: 'saint-gervais',
    ...overrides,
  }
}

const pois: GuestMapPoi[] = [
  poi({
    id: 'biche',
    name: 'Biche',
    categoryName: 'Restaurant',
    categorySlug: 'restaurant',
    categoryIcon: 'utensils',
    categoryColor: '#2f5d46',
  }),
  poi({
    id: 'chalet',
    name: 'Le Chalet',
    categoryName: 'Restaurant',
    categorySlug: 'restaurant',
    categoryIcon: 'utensils',
    categoryColor: '#2f5d46',
    latitude: 45.91,
  }),
  poi({
    id: 'miage',
    name: 'Alpage de Miage',
    categoryName: 'Rando',
    categorySlug: 'rando',
    categoryIcon: 'mountain',
    categoryColor: '#4f8a4e',
    longitude: 6.72,
  }),
]

describe('GuestMap category filter', () => {
  afterEach(() => {
    document.body.className = ''
  })

  it('filters recommendation markers by category from the side menu and restores all POIs', async () => {
    render(<GuestMap pois={pois} />)

    expect(screen.queryByText(/lieux? recommandé/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Biche' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Le Chalet' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Alpage de Miage' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /filtrer les catégories/i }))

    const menu = screen.getByRole('dialog', { name: /filtrer les catégories/i })
    expect(within(menu).getByRole('button', { name: /tous les lieux/i })).toBeInTheDocument()
    expect(within(menu).getByText('3')).toBeInTheDocument()
    expect(within(menu).getByRole('button', { name: /restaurant/i })).toBeInTheDocument()
    expect(within(menu).getByRole('button', { name: /rando/i })).toBeInTheDocument()

    await userEvent.click(within(menu).getByRole('button', { name: /restaurant/i }))

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Alpage de Miage' })).not.toBeInTheDocument()
    })
    expect(screen.queryByText(/lieux? recommandé/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Biche' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Le Chalet' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /filtrer les catégories/i }))
    await userEvent.click(screen.getByRole('button', { name: /tous les lieux/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Alpage de Miage' })).toBeInTheDocument()
    })
    expect(screen.queryByText(/lieux? recommandé/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Biche' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Le Chalet' })).toBeInTheDocument()
  })
})
