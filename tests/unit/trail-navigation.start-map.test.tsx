/**
 * @jest-environment jsdom
 */
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TrailNavigationMap } from '@/features/trail-navigation/components/TrailNavigationMap'

const mockEaseTo = jest.fn()
const mockFlyTo = jest.fn()
const mockDragRotateDisable = jest.fn()
const mockDragRotateEnable = jest.fn()
const mockTouchRotationDisable = jest.fn()
const mockTouchRotationEnable = jest.fn()
let mockOnMoveStart: ((evt: unknown) => void) | null = null

jest.mock('react-map-gl/mapbox', () => ({
  __esModule: true,
  default: jest.requireActual('react').forwardRef(
    (
      { children, onMoveStart }: { children: React.ReactNode; onMoveStart?: (evt: unknown) => void },
      ref: React.Ref<unknown>,
    ) => {
      const React = jest.requireActual('react') as typeof import('react')
      mockOnMoveStart = onMoveStart ?? null
      React.useImperativeHandle(ref, () => ({
        getMap: () => ({
          easeTo: mockEaseTo,
          dragRotate: {
            disable: mockDragRotateDisable,
            enable: mockDragRotateEnable,
          },
          touchZoomRotate: {
            disableRotation: mockTouchRotationDisable,
            enableRotation: mockTouchRotationEnable,
          },
        }),
        flyTo: mockFlyTo,
      }))
      return <div data-testid="mapbox-outdoors">{children}</div>
    },
  ),
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
    mockEaseTo.mockClear()
    mockFlyTo.mockClear()
    mockDragRotateDisable.mockClear()
    mockDragRotateEnable.mockClear()
    mockTouchRotationDisable.mockClear()
    mockTouchRotationEnable.mockClear()
    mockOnMoveStart = null
  })

  it('AC-02-03/AC-04-01: renders ready mode without starting GPS tracking automatically', () => {
    const clearWatch = jest.fn()
    const watchPosition = jest.fn()
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { watchPosition, clearWatch },
    })

    render(<TrailNavigationMap trail={trail} />)

    expect(screen.getByTestId('mapbox-outdoors')).toBeInTheDocument()
    expect(screen.getByTestId('map-layer-trail-line')).toBeInTheDocument()
    expect(screen.getByText(/Départ Mont Joux/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /activer le suivi gps/i })).toBeInTheDocument()
    // Santé GPS « ready » → point orange (en acquisition), libellé accessible préservé
    expect(screen.getByTestId('gps-health-dot')).toHaveStyle({ backgroundColor: '#F59E0B' })
    expect(screen.getByTitle(/Prêt/i)).toBeInTheDocument()
    expect(watchPosition).not.toHaveBeenCalled()
  })

  it('keeps the full-screen navigation constrained to the mobile app shell width', () => {
    render(<TrailNavigationMap trail={trail} />)

    expect(screen.getByTestId('trail-navigation-start')).toHaveClass(
      'mx-auto',
      'w-full',
      'max-w-[430px]',
    )
  })

  it('keeps the missing-geometry state constrained to the mobile app shell width', () => {
    render(<TrailNavigationMap trail={{ ...trail, geometry_geojson: null }} />)

    expect(screen.getByTestId('missing_geometry').closest('main')).toHaveClass(
      'mx-auto',
      'w-full',
      'max-w-[430px]',
    )
  })

  it('AC-02-06/AC-03-01/AC-04-04: starts watchPosition after explicit activation and clears it on unmount', async () => {
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

    expect(watchPosition).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))

    await waitFor(() => expect(watchPosition).toHaveBeenCalledTimes(1))
    // Tracking → point(s) vert(s) (fix fiable)
    await waitFor(() => {
      const dots = screen.getAllByTestId('gps-health-dot')
      expect(dots.length).toBeGreaterThan(0)
      dots.forEach(dot => expect(dot).toHaveStyle({ backgroundColor: '#16A34A' }))
    })

    unmount()

    expect(clearWatch).toHaveBeenCalledWith(42)
  })

  it('does not center the user before the hike is explicitly started', async () => {
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
      value: { watchPosition, clearWatch: jest.fn() },
    })

    render(<TrailNavigationMap trail={trail} />)
    mockEaseTo.mockClear()

    await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))

    await screen.findByRole('button', { name: /démarrer depuis ici/i })
    expect(mockEaseTo).not.toHaveBeenCalledWith(expect.objectContaining({
      center: [6.6731, 45.8732],
    }))
  })

  it('keeps the user centered after the hike has explicitly started', async () => {
    let gpsSuccess: PositionCallback | null = null
    const watchPosition = jest.fn((success: PositionCallback) => {
      gpsSuccess = success
      return 42
    })
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { watchPosition, clearWatch: jest.fn() },
    })

    render(<TrailNavigationMap trail={trail} />)
    await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))

    await waitFor(() => expect(watchPosition).toHaveBeenCalledTimes(1))
    act(() => {
      gpsSuccess?.({
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
    })

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /démarrer depuis ici/i })).toBeInTheDocument(),
    )
    expect(mockEaseTo).not.toHaveBeenCalledWith(expect.objectContaining({
      center: [6.6731, 45.8732],
    }))

    await userEvent.click(screen.getByRole('button', { name: /démarrer depuis ici/i }))

    await waitFor(() =>
      expect(mockEaseTo).toHaveBeenCalledWith(expect.objectContaining({
        center: [6.6731, 45.8732],
      })),
    )

    mockEaseTo.mockClear()
    act(() => {
      mockOnMoveStart?.({ originalEvent: new Event('pointerdown') })
    })
    act(() => {
      gpsSuccess?.({
        coords: {
          latitude: 45.8733,
          longitude: 6.6732,
          accuracy: 8,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: 4_500,
      } satisfies GeolocationPosition)
    })

    await waitFor(() =>
      expect(mockEaseTo).toHaveBeenCalledWith(expect.objectContaining({
        center: [6.6732, 45.8733],
      })),
    )
  })

  it('hides the red-white approach line after the user starts from here', async () => {
    const watchPosition = jest.fn((success: PositionCallback) => {
      success({
        coords: {
          latitude: 45.8737,
          longitude: 6.673,
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
      value: { watchPosition, clearWatch: jest.fn() },
    })

    render(<TrailNavigationMap trail={trail} />)
    await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))

    await screen.findByRole('button', { name: /démarrer depuis ici/i })
    expect(screen.getByTestId('map-layer-approach-line-halo')).toBeInTheDocument()
    expect(screen.getByTestId('map-layer-approach-line-layer')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /démarrer depuis ici/i }))

    expect(screen.queryByTestId('map-layer-approach-line-halo')).not.toBeInTheDocument()
    expect(screen.queryByTestId('map-layer-approach-line-layer')).not.toBeInTheDocument()
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
    await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))

    expect(screen.getByTestId('map-layer-trail-line')).toBeInTheDocument()
    // GPS refusé → point rouge (indisponible)
    await waitFor(() =>
      expect(screen.getByTestId('gps-health-dot')).toHaveStyle({ backgroundColor: '#DC2626' }),
    )
  })

  it('keeps the map panel collapsed when GPS acquisition later fails', async () => {
    let gpsError: PositionErrorCallback | null = null
    const watchPosition = jest.fn((_success: PositionCallback, error: PositionErrorCallback) => {
      gpsError = error
      return 7
    })
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { watchPosition, clearWatch: jest.fn() },
    })

    render(<TrailNavigationMap trail={trail} />)
    await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))
    await userEvent.click(screen.getByRole('button', { name: /réduire le panneau/i }))

    expect(screen.getByTestId('trail-navigation-panel')).toHaveAttribute('aria-hidden', 'true')

    act(() => {
      gpsError?.({ code: 1, message: 'denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 })
    })

    await waitFor(() =>
      expect(screen.getByTestId('trail-navigation-panel')).toHaveAttribute('aria-hidden', 'true'),
    )
    expect(screen.getByRole('button', { name: /afficher les détails/i })).toBeInTheDocument()
  })

  it('AC-03-03: shows pre-start state instead of off-track when first GPS position is far from the trail', async () => {
    const watchPosition = jest.fn((success: PositionCallback) => {
      success({
        coords: {
          latitude: 45.93,
          longitude: 6.76,
          accuracy: 8,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: 1,
      } satisfies GeolocationPosition)
      return 99
    })
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { watchPosition, clearWatch: jest.fn() },
    })

    render(<TrailNavigationMap trail={trail} />)
    await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))

    expect(await screen.findByText(/pas obligatoirement au début/i)).toBeInTheDocument()
    expect(screen.queryByText(/Vous semblez vous éloigner du tracé/i)).not.toBeInTheDocument()
  })
})
