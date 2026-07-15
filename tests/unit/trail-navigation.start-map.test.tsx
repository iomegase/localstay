/**
 * @jest-environment jsdom
 */
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  gpsHealthLabel,
  sampleBreadcrumbPoints,
  TrailNavigationMap,
} from '@/features/trail-navigation/components/TrailNavigationMap'
import { haversineMeters } from '@/features/trail-navigation/lib/geo'

const mockRouterBack = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockRouterBack }),
}))

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
      {
        children,
        onMoveStart,
        terrain,
        maxPitch,
        initialViewState,
      }: {
        children: React.ReactNode
        onMoveStart?: (evt: unknown) => void
        terrain?: unknown
        maxPitch?: number
        initialViewState?: unknown
      },
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
      return (
        <div
          data-testid="mapbox-outdoors"
          data-terrain={terrain ? JSON.stringify(terrain) : undefined}
          data-max-pitch={maxPitch}
          data-initial-view-state={initialViewState ? JSON.stringify(initialViewState) : undefined}
        >
          {children}
        </div>
      )
    },
  ),
  Source: ({
    children,
    id,
    type,
    url,
    tileSize,
    maxzoom,
  }: {
    children?: React.ReactNode
    id: string
    type: string
    url?: string
    tileSize?: number
    maxzoom?: number
  }) => (
    <div
      data-testid={`map-source-${id}`}
      data-source-type={type}
      data-source-url={url}
      data-tile-size={tileSize}
      data-max-zoom={maxzoom}
    >
      {children}
    </div>
  ),
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

function makePosition({
  latitude,
  longitude,
  accuracy = 8,
  timestamp = Date.now(),
}: {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp?: number
}): GeolocationPosition {
  return {
    coords: {
      latitude,
      longitude,
      accuracy,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp,
  }
}

describe('021 trail navigation start mode', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    mockRouterBack.mockClear()
    mockEaseTo.mockClear()
    mockFlyTo.mockClear()
    mockDragRotateDisable.mockClear()
    mockDragRotateEnable.mockClear()
    mockTouchRotationDisable.mockClear()
    mockTouchRotationEnable.mockClear()
    mockOnMoveStart = null
  })

  it('exposes distinct French labels for every GPS health state', () => {
    expect(gpsHealthLabel('inactive')).toBe('GPS inactif')
    expect(gpsHealthLabel('prompting')).toBe('Recherche GPS')
    expect(gpsHealthLabel('good')).toBe('Signal GPS fiable')
    expect(gpsHealthLabel('low_accuracy')).toBe('Précision GPS faible')
    expect(gpsHealthLabel('denied')).toBe('Accès GPS refusé')
    expect(gpsHealthLabel('unavailable')).toBe('Signal GPS indisponible')
  })

  it('uniformly bounds breadcrumb points while retaining ordered endpoints', () => {
    const points = Array.from({ length: 1_001 }, (_, index) => ({ index }))

    const sampled = sampleBreadcrumbPoints(points, 500)

    expect(sampled).toHaveLength(500)
    expect(sampled[0]).toBe(points[0])
    expect(sampled.at(-1)).toBe(points.at(-1))
    expect(sampled.every((point, index) => index === 0 || point.index > sampled[index - 1].index)).toBe(true)
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
    expect(screen.getByRole('button', { name: 'Position indisponible' })).toBeDisabled()
    // Santé GPS « ready » → point orange (en acquisition), libellé accessible préservé
    expect(screen.getByTestId('gps-health-dot')).toHaveStyle({ backgroundColor: '#F59E0B' })
    expect(screen.getByTitle('GPS inactif')).toBeInTheDocument()
    expect(watchPosition).not.toHaveBeenCalled()
  })

  it('AC-02-08/BR-30: enables Mapbox terrain without IGN and preserves the immersive camera pitch', async () => {
    const watchPosition = jest.fn((success: PositionCallback) => {
      success(makePosition({ latitude: 45.8732, longitude: 6.6731 }))
      return 42
    })
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { watchPosition, clearWatch: jest.fn() },
    })

    render(<TrailNavigationMap trail={trail} />)

    const map = screen.getByTestId('mapbox-outdoors')
    expect(JSON.parse(map.getAttribute('data-terrain') ?? 'null')).toEqual({
      source: 'mapbox-dem',
      exaggeration: 1.2,
    })
    expect(map).toHaveAttribute('data-max-pitch', '75')
    expect(JSON.parse(map.getAttribute('data-initial-view-state') ?? 'null')).toMatchObject({
      pitch: 0,
    })

    const dem = screen.getByTestId('map-source-mapbox-dem')
    expect(dem).toHaveAttribute('data-source-type', 'raster-dem')
    expect(dem).toHaveAttribute('data-source-url', 'mapbox://mapbox.mapbox-terrain-dem-v1')
    expect(dem).toHaveAttribute('data-tile-size', '512')
    expect(dem).toHaveAttribute('data-max-zoom', '14')
    expect(screen.queryByTestId('map-source-ign-base')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))
    await waitFor(() => expect(watchPosition).toHaveBeenCalledTimes(1))
    expect(mockFlyTo).toHaveBeenCalledWith(expect.objectContaining({ pitch: 55 }))

    mockFlyTo.mockClear()
    await userEvent.click(screen.getByRole('button', { name: 'Recentrer sur ma position' }))
    expect(mockFlyTo).toHaveBeenCalledWith(expect.objectContaining({ pitch: 55 }))
  })

  it('keeps the full-screen navigation constrained to the mobile app shell width', () => {
    render(<TrailNavigationMap trail={trail} />)

    expect(screen.getByTestId('trail-navigation-start')).toHaveClass(
      'mx-auto',
      'w-full',
      'max-w-[430px]',
    )
  })

  it('AC-02-07/BR-29: keeps the Close control above Mapbox and returns to the previous screen', async () => {
    render(<TrailNavigationMap trail={trail} />)

    const controls = screen.getByTestId('trail-top-controls')
    const close = screen.getByRole('button', { name: 'Fermer' })

    expect(controls).toHaveClass('z-30', 'pointer-events-none')
    expect(close).toHaveClass('pointer-events-auto', 'h-11', 'w-11')

    close.focus()
    expect(close).toHaveFocus()
    await userEvent.click(close)

    expect(mockRouterBack).toHaveBeenCalledTimes(1)
  })

  it('AC-02-07: uses the modal close callback instead of router history when provided', async () => {
    const onClose = jest.fn()
    render(<TrailNavigationMap trail={trail} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Fermer' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(mockRouterBack).not.toHaveBeenCalled()
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
      success(makePosition({ latitude: 45.8732, longitude: 6.6731 }))
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
    expect(screen.getByRole('button', { name: 'Recentrer sur ma position' })).toBeEnabled()
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
      success(makePosition({ latitude: 45.8732, longitude: 6.6731 }))
      return 42
    })
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { watchPosition, clearWatch: jest.fn() },
    })

    render(<TrailNavigationMap trail={trail} />)
    mockEaseTo.mockClear()

    await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))

    await screen.findByRole('button', { name: 'Démarrer ici' })
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
      gpsSuccess?.(makePosition({ latitude: 45.8732, longitude: 6.6731 }))
    })

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Démarrer ici' })).toBeInTheDocument(),
    )
    expect(mockEaseTo).not.toHaveBeenCalledWith(expect.objectContaining({
      center: [6.6731, 45.8732],
    }))

    await userEvent.click(screen.getByRole('button', { name: 'Démarrer ici' }))

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
      gpsSuccess?.(makePosition({ latitude: 45.8733, longitude: 6.6732 }))
    })

    await waitFor(() =>
      expect(mockEaseTo).toHaveBeenCalledWith(expect.objectContaining({
        center: [6.6732, 45.8733],
      })),
    )
  })

  it('AC-05-06/BR-19: never renders a straight-line approach layer', async () => {
    let gpsSuccess: PositionCallback | null = null
    const startedAt = Date.now()
    const watchPosition = jest.fn((success: PositionCallback) => {
      gpsSuccess = success
      return 42
    })
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { watchPosition, clearWatch: jest.fn() },
    })

    render(<TrailNavigationMap trail={trail} />)
    expect(screen.queryByTestId('map-layer-approach-line-halo')).not.toBeInTheDocument()
    expect(screen.queryByTestId('map-layer-approach-line-layer')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))
    act(() => {
      gpsSuccess?.(makePosition({
        latitude: 45.879,
        longitude: 6.673,
        timestamp: startedAt,
      }))
    })

    await screen.findByRole('button', { name: 'Démarrer ici' })
    expect(screen.getByText(/Vous êtes à \d+ m du tracé/i)).toBeInTheDocument()
    expect(screen.queryByTestId('map-layer-approach-line-halo')).not.toBeInTheDocument()
    expect(screen.queryByTestId('map-layer-approach-line-layer')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Démarrer ici' }))
    expect(screen.getByText(/En route vers le tracé/i)).toBeInTheDocument()
    expect(screen.queryByTestId('map-layer-approach-line-halo')).not.toBeInTheDocument()
    expect(screen.queryByTestId('map-layer-approach-line-layer')).not.toBeInTheDocument()

    act(() => {
      gpsSuccess?.(makePosition({
        latitude: 45.875,
        longitude: 6.676,
        timestamp: startedAt + 4_000,
      }))
    })

    await waitFor(() => {
      expect(screen.queryByText(/En route vers le tracé/i)).not.toBeInTheDocument()
    })
    expect(screen.queryByTestId('map-layer-approach-line-halo')).not.toBeInTheDocument()
    expect(screen.queryByTestId('map-layer-approach-line-layer')).not.toBeInTheDocument()
  })

  it('offers a local start only after a reliable GPS fix near a middle trail segment', async () => {
    let gpsSuccess: PositionCallback | null = null
    const watchPosition = jest.fn((success: PositionCallback) => {
      gpsSuccess = success
      return 42
    })
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { watchPosition, clearWatch: jest.fn() },
    })

    const middleTrail = {
      ...trail,
      geometry_geojson: {
        type: 'LineString',
        coordinates: [
          [6.65, 45.8731],
          [6.7, 45.8731],
          [6.75, 45.8731],
        ],
      },
    }
    const interiorFix = { latitude: 45.8831, longitude: 6.7 }
    const coordinates = middleTrail.geometry_geojson.coordinates
    expect(haversineMeters(interiorFix, {
      longitude: coordinates[0][0],
      latitude: coordinates[0][1],
    })).toBeGreaterThan(1_500)
    expect(haversineMeters(interiorFix, {
      longitude: coordinates.at(-1)![0],
      latitude: coordinates.at(-1)![1],
    })).toBeGreaterThan(1_500)
    render(<TrailNavigationMap trail={middleTrail} />)

    expect(screen.queryByRole('button', { name: 'Démarrer ici' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))
    act(() => {
      gpsSuccess?.(makePosition(interiorFix))
    })

    expect(await screen.findByRole('button', { name: 'Démarrer ici' })).toBeInTheDocument()
  })

  it('shows entry progress before start, then only live session distance and duration', async () => {
    const startedAt = 1_800_000_000_000
    let nowMs = startedAt
    jest.spyOn(Date, 'now').mockImplementation(() => nowMs)
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
    act(() => {
      gpsSuccess?.(makePosition({ latitude: 45.875, longitude: 6.676, timestamp: startedAt }))
    })

    const startButton = await screen.findByRole('button', { name: 'Démarrer ici' })
    expect(screen.getByText(/Point d'entrée estimé :/i)).toBeInTheDocument()
    expect(screen.queryByText(/m parcourus estimés/i)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /réduire le panneau/i }))
    let hud = within(screen.getByTestId('trail-navigation-hud'))
    expect(hud.getByText('2.7')).toBeInTheDocument()
    expect(hud.getByText(/%/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /afficher les détails/i }))

    await userEvent.click(startButton)

    const panel = within(screen.getByTestId('trail-navigation-panel'))
    expect(panel.getByText('0.00 km')).toBeInTheDocument()
    expect(panel.getByText('0 min')).toBeInTheDocument()
    expect(panel.queryByText('D+')).not.toBeInTheDocument()
    expect(panel.queryByText(/Point d'entrée estimé/i)).not.toBeInTheDocument()

    act(() => {
      nowMs = startedAt + 10_000
      gpsSuccess?.(makePosition({
        latitude: 45.87537,
        longitude: 6.6766,
        timestamp: nowMs,
      }))
    })

    await userEvent.click(screen.getByRole('button', { name: /réduire le panneau/i }))
    hud = within(screen.getByTestId('trail-navigation-hud'))
    expect(hud.getByText('0.1')).toBeInTheDocument()
    expect(hud.getByText('10 s')).toBeInTheDocument()
    expect(hud.queryByText(/%/)).not.toBeInTheDocument()
  })

  it('never sends the GPS position to the walking-route API', async () => {
    const originalFetchDescriptor = Object.getOwnPropertyDescriptor(global, 'fetch')
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      writable: true,
      value: jest.fn(),
    })
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response)
    const watchPosition = jest.fn((success: PositionCallback) => {
      success(makePosition({ latitude: 45.879, longitude: 6.673 }))
      return 42
    })
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { watchPosition, clearWatch: jest.fn() },
    })

    try {
      render(<TrailNavigationMap trail={trail} />)
      await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))

      await waitFor(() => expect(watchPosition).toHaveBeenCalledTimes(1))
      await act(async () => {
        await new Promise(resolve => window.setTimeout(resolve, 700))
      })
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally {
      fetchSpy.mockRestore()
      if (originalFetchDescriptor) {
        Object.defineProperty(global, 'fetch', originalFetchDescriptor)
      } else {
        Reflect.deleteProperty(global, 'fetch')
      }
    }
  })

  it('does not register another geolocation watcher when the map rerenders', async () => {
    const watchPosition = jest.fn(() => 42)
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { watchPosition, clearWatch: jest.fn() },
    })

    const { rerender } = render(<TrailNavigationMap trail={trail} />)
    await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))
    await waitFor(() => expect(watchPosition).toHaveBeenCalledTimes(1))

    rerender(<TrailNavigationMap trail={{ ...trail }} />)

    expect(watchPosition).toHaveBeenCalledTimes(1)
  })

  it('resets GPS and session state when the trail identity changes and evaluates new fixes against the new geometry', async () => {
    const callbacks: PositionCallback[] = []
    const clearWatch = jest.fn()
    const watchPosition = jest.fn((success: PositionCallback) => {
      callbacks.push(success)
      return callbacks.length === 1 ? 42 : 43
    })
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { watchPosition, clearWatch },
    })
    const trailB = {
      ...trail,
      id: 'poi-2',
      slug: 'trail-b',
      name: 'Trail B',
      start_latitude: 46,
      start_longitude: 7,
      geometry_geojson: {
        type: 'LineString' as const,
        coordinates: [[7, 46], [7.01, 46.01]],
      },
    }

    const { rerender } = render(<TrailNavigationMap trail={trail} />)
    await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))
    act(() => callbacks[0](makePosition({ latitude: 45.8732, longitude: 6.6731 })))
    await userEvent.click(await screen.findByRole('button', { name: 'Démarrer ici' }))
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()

    rerender(<TrailNavigationMap trail={trailB} />)

    await waitFor(() => expect(clearWatch).toHaveBeenCalledTimes(1))
    expect(clearWatch).toHaveBeenCalledWith(42)
    expect(screen.queryByRole('button', { name: 'Stop' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /activer le suivi gps/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Position indisponible' })).toBeDisabled()
    expect(watchPosition).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))
    expect(watchPosition).toHaveBeenCalledTimes(2)
    act(() => callbacks[1](makePosition({ latitude: 46.0001, longitude: 7.0001 })))

    expect(await screen.findByRole('button', { name: 'Démarrer ici' })).toBeInTheDocument()
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
    expect(screen.getAllByText('Accès GPS refusé').length).toBeGreaterThan(0)
    expect(screen.getByTitle('Accès GPS refusé')).toBeInTheDocument()
  })

  it('keeps an active session stoppable while independently announcing an unavailable GPS signal', async () => {
    let gpsSuccess: PositionCallback | null = null
    let gpsError: PositionErrorCallback | null = null
    const watchPosition = jest.fn((success: PositionCallback, error: PositionErrorCallback) => {
      gpsSuccess = success
      gpsError = error
      return 42
    })
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { watchPosition, clearWatch: jest.fn() },
    })

    render(<TrailNavigationMap trail={trail} />)
    await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))
    act(() => gpsSuccess?.(makePosition({ latitude: 45.8732, longitude: 6.6731 })))
    await userEvent.click(await screen.findByRole('button', { name: 'Démarrer ici' }))
    act(() => {
      gpsError?.({ code: 2, message: 'lost', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 })
    })

    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
    expect(screen.getAllByText('Signal GPS indisponible').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Suivi du tracé').length).toBeGreaterThan(0)
    screen.getAllByTestId('gps-health-dot').forEach(dot => {
      expect(dot).toHaveAttribute('aria-label', 'Signal GPS indisponible')
    })
    expect(screen.queryByTitle('GPS actif')).not.toBeInTheDocument()
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
      success(makePosition({ latitude: 45.93, longitude: 6.76 }))
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
