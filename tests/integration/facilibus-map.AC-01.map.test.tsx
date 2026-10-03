/** @jest-environment jsdom */

import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { FacilibusMap } from '@/features/transport/components/FacilibusMap'

jest.mock('react-map-gl/mapbox', () => {
  const addLayer = jest.fn()
  const flyTo = jest.fn()
  const MockMap = React.forwardRef<unknown, {
    children: React.ReactNode
    initialViewState?: { latitude: number; longitude: number; zoom: number; pitch: number; bearing: number }
    onLoad?: () => void
    onZoom?: (event: { viewState: { zoom: number } }) => void
  }>(
    ({ children, initialViewState, onLoad, onZoom }, ref) => {
      const didLoad = React.useRef(false)
      React.useImperativeHandle(ref, () => ({
        flyTo, resize: jest.fn(),
        getMap: () => ({ getLayer: () => undefined, getStyle: () => ({ layers: [] }), addLayer }),
      }))
      React.useEffect(() => {
        if (didLoad.current) return
        didLoad.current = true
        onLoad?.()
      }, [onLoad])
      return (
        <div data-testid="mapbox-map" data-initial-view={JSON.stringify(initialViewState)}>
          <button type="button" onClick={() => onZoom?.({ viewState: { zoom: 15 } })}>zoom-in-test</button>
          <button type="button" onClick={() => onZoom?.({ viewState: { zoom: 13 } })}>zoom-out-test</button>
          {children}
        </div>
      )
    },
  )
  MockMap.displayName = 'MockMap'
  return {
    __esModule: true,
    default: MockMap,
    Marker: ({ children }: { children: React.ReactNode }) => <div data-testid="mapbox-marker">{children}</div>,
    Source: ({ children, data }: { children?: React.ReactNode; data: unknown }) => (
      <div data-testid="mapbox-source" data-geojson={JSON.stringify(data)}>{children}</div>
    ),
    Layer: () => null,
    __mockAddLayer: addLayer,
    __mockFlyTo: flyTo,
  }
})

const stations = [
  { id: 'dmc', name: 'Télécabine de Saint Gervais / Le Chatelet', latitude: 45.8905, longitude: 6.7073, routes: [] },
  { id: 'comtesse', name: 'La Comtesse', latitude: 45.8911, longitude: 6.713, routes: [] },
]
const lines = [{ routeId: 'L1', shortName: '1', longName: '', color: '#228947', textColor: '#ffffff', paths: [[[6.7, 45.89], [6.71, 45.9]]] }]
const vehicle = (overrides: Record<string, unknown>) => ({
  publicId: 'v1', network: 'facilibus', routeId: 'L1', tripId: 'L1A_7', startDate: null, latitude: 45.89, longitude: 6.71,
  stopId: null, status: 'in_transit', measuredAt: 1790940807, freshness: 'fresh', ...overrides,
})

function renderMap(overrides: Partial<React.ComponentProps<typeof FacilibusMap>> = {}) {
  const onSelect = jest.fn()
  render(
    <FacilibusMap
      stations={stations}
      lines={lines}
      vehicles={[vehicle({}), vehicle({ publicId: 'old', freshness: 'stale' }), vehicle({ publicId: 'unknown', freshness: 'unknown' })]}
      selectedId="dmc"
      origin={{ latitude: 45.8915, longitude: 6.7085 }}
      onSelect={onSelect}
      {...overrides}
    />,
  )
  return onSelect
}

describe('058 Facilibus map', () => {
  beforeEach(() => jest.clearAllMocks())

  it('AC-01-01: pins every station, the lodging and the coloured lines', () => {
    renderMap()
    expect(screen.getByRole('button', { name: 'Arrêt Télécabine de Saint Gervais / Le Chatelet' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Arrêt La Comtesse' })).toBeInTheDocument()
    expect(screen.getByLabelText('Votre logement')).toBeInTheDocument()
    const geojson = JSON.parse(screen.getByTestId('mapbox-source').getAttribute('data-geojson') ?? '{}')
    expect(geojson.features[0].properties.color).toBe('#228947')
  })

  it('starts close to the lodging with a pitched 3D view', () => {
    renderMap()
    const view = JSON.parse(screen.getByTestId('mapbox-map').getAttribute('data-initial-view') ?? '{}')
    expect(view).toEqual(expect.objectContaining({ latitude: 45.8915, longitude: 6.7085, zoom: 15.3, pitch: 58 }))
    const { __mockAddLayer, __mockFlyTo } = jest.requireMock('react-map-gl/mapbox') as { __mockAddLayer: jest.Mock; __mockFlyTo: jest.Mock }
    expect(__mockAddLayer).toHaveBeenCalledWith(expect.objectContaining({
      id: 'facilibus-3d-buildings', type: 'fill-extrusion', source: 'composite',
    }), undefined)
    expect(__mockFlyTo).not.toHaveBeenCalled()
  })

  it('AC-01-02: labels other stations at the new initial zoom and keeps the selected one visible when zoomed out', () => {
    renderMap()
    expect(screen.getByText('Télécabine de Saint Gervais / Le Chatelet')).toBeInTheDocument()
    expect(screen.getByText('La Comtesse')).toBeInTheDocument()
    fireEvent.click(screen.getByText('zoom-out-test'))
    expect(screen.getByText('Télécabine de Saint Gervais / Le Chatelet')).toBeInTheDocument()
    expect(screen.queryByText('La Comtesse')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('zoom-in-test'))
    expect(screen.getByText('La Comtesse')).toBeInTheDocument()
  })

  it('AC-01-03: selects a station from its pin', () => {
    const onSelect = renderMap()
    fireEvent.click(screen.getByRole('button', { name: 'Arrêt La Comtesse' }))
    expect(onSelect).toHaveBeenCalledWith('comtesse')
    expect(screen.getByRole('button', { name: 'Arrêt Télécabine de Saint Gervais / Le Chatelet' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('AC-01-04: shows only shuttles with a fresh position, in their line colour', () => {
    renderMap()
    const shuttles = screen.getAllByRole('img', { name: /Navette ligne/ })
    expect(shuttles).toHaveLength(1)
    expect(within(shuttles[0]).getByText('1')).toBeInTheDocument()
    expect(within(shuttles[0]).getByTestId('shuttle-bus-icon')).toBeInTheDocument()
  })

  it('opens the map full screen and closes it with the button or Escape', () => {
    renderMap()
    const container = screen.getByTestId('facilibus-map')
    expect(container).toHaveClass('h-[260px]')

    fireEvent.click(screen.getByRole('button', { name: 'Afficher la carte en plein écran' }))
    expect(container).toHaveClass('absolute', 'inset-0')
    expect(container).toHaveAttribute('role', 'dialog')

    fireEvent.click(screen.getByRole('button', { name: 'Quitter le plein écran' }))
    expect(container).toHaveClass('h-[260px]')

    fireEvent.click(screen.getByRole('button', { name: 'Afficher la carte en plein écran' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(container).toHaveClass('h-[260px]')
  })
})
