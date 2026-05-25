/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import { TrailNavigationMap } from '@/features/trail-navigation/components/TrailNavigationMap'

jest.mock('react-map-gl/mapbox', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="mapbox-outdoors">{children}</div>,
  Source: ({ children }: { children: React.ReactNode }) => <div data-testid="map-source">{children}</div>,
  Layer: ({ id }: { id: string }) => <div data-testid={`map-layer-${id}`} />,
  Marker: ({ children }: { children: React.ReactNode }) => <div data-testid="map-marker">{children}</div>,
  NavigationControl: () => <div data-testid="navigation-control" />,
}))

const trail = {
  id: 'poi-1',
  slug: 'mont-joux',
  name: 'Mont Joux',
  description: 'Panorama familial.',
  start_label: 'Départ Mont Joux',
  start_latitude: 45.8731,
  start_longitude: 6.673,
  geometry_geojson: {
    type: 'LineString',
    coordinates: [
      [6.673, 45.8731],
      [6.681, 45.878],
    ],
  },
  difficulty: 'easy',
  distance_km: 2.7,
  elevation_gain_m: 166,
  estimated_duration_min: 60,
  data_quality_status: 'complete',
  source_refs: [],
}

describe('021 trail navigation start mode', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('AC-02-03/AC-03-01/AC-04-04: renders outdoor trail map and stops watchPosition on unmount', async () => {
    const clearWatch = jest.fn()
    const watchPosition = jest.fn((success: PositionCallback) => {
      success({
        coords: {
          latitude: 45.8732,
          longitude: 6.6731,
          accuracy: 8,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: 1,
      } satisfies GeolocationPosition)
      return 42
    })
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { watchPosition, clearWatch },
    })

    const { unmount } = render(<TrailNavigationMap trail={trail} />)

    expect(screen.getByTestId('mapbox-outdoors')).toBeInTheDocument()
    expect(screen.getByTestId('map-layer-trail-line')).toBeInTheDocument()
    expect(screen.getByText(/Départ Mont Joux/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(/GPS actif/i)).toBeInTheDocument())

    unmount()

    expect(clearWatch).toHaveBeenCalledWith(42)
  })

  it('AC-02-04/AC-03-05: keeps trail visible when GPS is denied or inaccurate', async () => {
    const watchPosition = jest.fn((_success: PositionCallback, error: PositionErrorCallback) => {
      error({ code: 1, message: 'denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 })
      return 7
    })
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { watchPosition, clearWatch: jest.fn() },
    })

    render(<TrailNavigationMap trail={trail} />)

    expect(screen.getByTestId('map-layer-trail-line')).toBeInTheDocument()
    expect(await screen.findByText(/GPS indisponible/i)).toBeInTheDocument()
  })
})
