/** @jest-environment jsdom */

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TrailNavigationMap } from '@/features/trail-navigation/components/TrailNavigationMap'
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

jest.mock('react-map-gl/mapbox', () => ({
  __esModule: true,
  default: jest.requireActual('react').forwardRef(
    ({ children }: { children: React.ReactNode }, ref: React.Ref<unknown>) => {
      const React = jest.requireActual('react') as typeof import('react')
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
  Source: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-source">{children}</div>
  ),
  Layer: ({ id }: { id: string }) => <div data-testid={`map-layer-${id}`} />,
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-marker">{children}</div>
  ),
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
  timestamp = Date.now(),
}: {
  latitude: number
  longitude: number
  timestamp?: number
}): GeolocationPosition {
  return {
    coords: {
      latitude,
      longitude,
      accuracy: 8,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp,
  }
}

const positionUnavailable: GeolocationPositionError = {
  code: 2,
  message: 'position unavailable',
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
}

describe('021 trail navigation session flow', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    mockRouterBack.mockClear()
    mockEaseTo.mockClear()
    mockFlyTo.mockClear()
    mockDragRotateDisable.mockClear()
    mockDragRotateEnable.mockClear()
    mockTouchRotationDisable.mockClear()
    mockTouchRotationEnable.mockClear()
  })

  it('AC-02-07/BR-29 + AC-05-07/08/09/10: freezes available-only values even when clearWatch throws and late updates arrive', async () => {
    const startedAt = 1_800_000_000_000
    let nowMs = startedAt
    jest.spyOn(Date, 'now').mockImplementation(() => nowMs)
    let gpsSuccess: PositionCallback | null = null
    let gpsError: PositionErrorCallback | null = null
    const clearWatch = jest.fn(() => {
      throw new Error('platform clearWatch failure')
    })
    const watchPosition = jest.fn((success: PositionCallback, error: PositionErrorCallback) => {
      gpsSuccess = success
      gpsError = error
      return 42
    })
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { watchPosition, clearWatch },
    })

    render(<TrailNavigationMap trail={trail} backHref="/guide/megeve/rando/mont-joux" />)

    await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))
    const firstPoint = { latitude: 45.8731, longitude: 6.673 }
    const secondPoint = { latitude: 45.87315, longitude: 6.67308 }
    act(() => {
      gpsSuccess?.(makePosition({ ...firstPoint, timestamp: startedAt }))
    })
    await userEvent.click(await screen.findByRole('button', { name: 'Démarrer ici' }))

    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Fermer' })).not.toBeInTheDocument()

    act(() => {
      nowMs = startedAt + 4_000
      gpsSuccess?.(makePosition({ ...secondPoint, timestamp: nowMs }))
      gpsError?.(positionUnavailable)
    })

    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
    const stop = screen.getByRole('button', { name: 'Stop' })
    act(() => {
      nowMs = startedAt + 65_000
      fireEvent.click(stop)
      fireEvent.click(stop)
    })

    expect(clearWatch).toHaveBeenCalledTimes(1)
    const dialog = await screen.findByRole('dialog', { name: 'Randonnée terminée' })
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByText('Distance parcourue')).toBeInTheDocument()
    expect(within(dialog).getByText('Durée')).toBeInTheDocument()
    const frozenDistance = `${Math.round(haversineMeters(firstPoint, secondPoint))} m`
    expect(within(dialog).getByText(frozenDistance)).toBeInTheDocument()
    expect(within(dialog).getByText('1 min')).toBeInTheDocument()
    expect(within(dialog).queryByText(/pas/i)).not.toBeInTheDocument()
    expect(within(dialog).queryByText(/n\/a/i)).not.toBeInTheDocument()

    act(() => {
      nowMs = startedAt + 300_000
      gpsSuccess?.(makePosition({
        latitude: 45.878,
        longitude: 6.681,
        timestamp: nowMs,
      }))
    })

    expect(within(dialog).getByText(frozenDistance)).toBeInTheDocument()
    expect(within(dialog).getByText('1 min')).toBeInTheDocument()
    expect(clearWatch).toHaveBeenCalledTimes(1)
  })

  it('AC-02-07/AC-04-04: Close goes back and clears GPS without creating a summary', async () => {
    const clearWatch = jest.fn()
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        watchPosition: jest.fn(() => 91),
        clearWatch,
      },
    })

    const { unmount } = render(<TrailNavigationMap trail={trail} />)
    await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('dialog', { name: /randonnée terminée/i })).not.toBeInTheDocument()

    unmount()

    expect(mockRouterBack).toHaveBeenCalledTimes(1)
    expect(clearWatch).toHaveBeenCalledTimes(1)
  })

  it('AC-02-07/BR-29: restores the Close control after viewing the stopped trail and exits without another summary', async () => {
    const startedAt = 1_800_000_000_000
    jest.spyOn(Date, 'now').mockReturnValue(startedAt)
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
      gpsSuccess?.(makePosition({
        latitude: 45.8731,
        longitude: 6.673,
        timestamp: startedAt,
      }))
    })
    await userEvent.click(await screen.findByRole('button', { name: 'Démarrer ici' }))

    const stop = screen.getByRole('button', { name: 'Stop' })
    stop.focus()
    await userEvent.click(stop)

    const viewTrail = await screen.findByRole('button', { name: 'Voir le tracé' })
    await waitFor(() => expect(viewTrail).toHaveFocus())
    await userEvent.click(viewTrail)

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Randonnée terminée' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Fermer' })).toHaveFocus()
    })

    await userEvent.click(screen.getByRole('button', { name: 'Fermer' }))

    expect(mockRouterBack).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog', { name: 'Randonnée terminée' })).not.toBeInTheDocument()
  })

  it('AC-05-11: reaching the official end never stops the session automatically', async () => {
    const startedAt = 1_800_000_000_000
    jest.spyOn(Date, 'now').mockReturnValue(startedAt)
    let gpsSuccess: PositionCallback | null = null
    const watchPosition = jest.fn((success: PositionCallback) => {
      gpsSuccess = success
      return 42
    })
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { watchPosition, clearWatch: jest.fn() },
    })
    render(<TrailNavigationMap trail={trail} backHref="/guide/megeve/rando/mont-joux" />)

    await userEvent.click(screen.getByRole('button', { name: /activer le suivi gps/i }))
    act(() => {
      gpsSuccess?.(makePosition({
        latitude: 45.8732,
        longitude: 6.6731,
        timestamp: startedAt,
      }))
    })
    await userEvent.click(await screen.findByRole('button', { name: 'Démarrer ici' }))

    act(() => {
      gpsSuccess?.(makePosition({
        latitude: 45.878,
        longitude: 6.681,
        timestamp: startedAt + 4_000,
      }))
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
    })
    expect(screen.queryByRole('dialog', { name: 'Randonnée terminée' })).not.toBeInTheDocument()
  })
})
