/** @jest-environment jsdom */

import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TrailNavigationMap } from '@/features/trail-navigation/components/TrailNavigationMap'

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
    mockEaseTo.mockClear()
    mockFlyTo.mockClear()
    mockDragRotateDisable.mockClear()
    mockDragRotateEnable.mockClear()
    mockTouchRotationDisable.mockClear()
    mockTouchRotationEnable.mockClear()
  })

  it('AC-05-07/08/09/10: keeps Stop after GPS loss and opens a frozen available-only summary', async () => {
    let gpsSuccess: PositionCallback | null = null
    let gpsError: PositionErrorCallback | null = null
    const clearWatch = jest.fn()
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
    act(() => {
      gpsSuccess?.(makePosition({ latitude: 45.8732, longitude: 6.6731 }))
    })
    await userEvent.click(await screen.findByRole('button', { name: 'Démarrer ici' }))

    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()

    act(() => {
      gpsError?.(positionUnavailable)
    })

    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Stop' }))

    expect(clearWatch).toHaveBeenCalledTimes(1)
    const dialog = await screen.findByRole('dialog', { name: 'Randonnée terminée' })
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByText('Distance parcourue')).toBeInTheDocument()
    expect(within(dialog).getByText('Durée')).toBeInTheDocument()
    expect(within(dialog).queryByText(/pas/i)).not.toBeInTheDocument()
    expect(within(dialog).queryByText(/n\/a/i)).not.toBeInTheDocument()
  })

  it('AC-05-11: reaching the official end never stops the session automatically', async () => {
    let gpsSuccess: PositionCallback | null = null
    const watchPosition = jest.fn((success: PositionCallback) => {
      gpsSuccess = success
      return 42
    })
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { watchPosition, clearWatch: jest.fn() },
    })
    const startedAt = Date.now()

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
