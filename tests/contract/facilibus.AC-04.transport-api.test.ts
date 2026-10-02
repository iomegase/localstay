/** @jest-environment node */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { NextRequest } from 'next/server'
import { setFacilibusProvider } from '@/features/transport/facilibus'
import { resetTransportCache } from '@/features/transport/lib/cache'
import { parseGtfsStatic } from '@/features/transport/lib/gtfs-static'
import { normalizeVehicles } from '@/features/transport/lib/vehicles'
import { readZipEntries } from '@/features/transport/lib/zip'
import type { TransportProvider } from '@/features/transport/providers/types'
const mockStayContext = jest.fn()
const mockTravelTimes = jest.fn()
jest.mock('@/features/public-menu/lib/lodging-mode', () => ({ getActiveLodgingContext: () => mockStayContext() }))
jest.mock('@/features/transport/travel-times', () => ({ getCachedTravelTimes: (...args: unknown[]) => mockTravelTimes(...args) }))

import { GET as nearby } from '@/app/api/transport/facilibus/nearby/route'
import { GET as stops } from '@/app/api/transport/facilibus/stops/route'
import { GET as departures } from '@/app/api/transport/facilibus/departures/route'
import { GET as vehicles } from '@/app/api/transport/facilibus/vehicles/route'
import { GET as lines } from '@/app/api/transport/facilibus/lines/route'

const fixture = (name: string) => readFileSync(path.join(__dirname, '../fixtures/facilibus', name))
const gtfs = parseGtfsStatic(readZipEntries(fixture('gtfs-pub.zip')))
const vehicleFeed = JSON.parse(fixture('vehicle-position.json').toString())

function provider(overrides: Partial<TransportProvider> = {}): TransportProvider {
  return {
    fetchStaticFeed: jest.fn().mockResolvedValue(gtfs),
    fetchStopTimes: jest.fn().mockResolvedValue([]),
    fetchTripUpdates: jest.fn().mockResolvedValue({ producedAt: null, trips: [] }),
    fetchVehicles: jest.fn().mockResolvedValue({ producedAt: 1790940811, vehicles: normalizeVehicles(vehicleFeed) }),
    ...overrides,
  }
}

const get = (url: string) => new NextRequest(`http://localhost${url}`)
let errorLog: jest.SpyInstance

beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2026-10-02T08:00:00Z') })
  resetTransportCache()
  setFacilibusProvider(provider())
  mockStayContext.mockResolvedValue(null)
  mockTravelTimes.mockReset()
  errorLog = jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  jest.useRealTimers()
  errorLog.mockRestore()
})

describe('055 transport API', () => {
  it('AC-04-01: validates coordinates and returns nearby stations within the limit', async () => {
    expect((await nearby(get('/api/transport/facilibus/nearby?lat=91&lng=6'))).status).toBe(400)
    expect((await nearby(get('/api/transport/facilibus/nearby?lat=abc&lng=6'))).status).toBe(400)

    const response = await nearby(get('/api/transport/facilibus/nearby?lat=45.8915&lng=6.7085'))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.status).toBe('available')
    expect(body.data.stations[0]).toMatchObject({ id: 'dmc', name: 'Télécabine de Saint Gervais / Le Chatelet' })
    expect(body.data.stations[0].distanceMeters).toBeLessThan(200)
    expect(body.meta).toEqual(expect.objectContaining({ fetchedAt: expect.any(String), freshness: expect.any(String) }))

    const far = await (await nearby(get('/api/transport/facilibus/nearby?lat=48.85&lng=2.35'))).json()
    expect(far.status).toBe('outside_coverage')
    expect(far.data.stations).toEqual([])
  })

  it('lists the physical stations', async () => {
    const body = await (await stops(get('/api/transport/facilibus/stops'))).json()
    expect(body.status).toBe('available')
    expect(body.data.some((station: { id: string }) => station.id === 'eglise-lieu')).toBe(true)
  })

  it('AC-02-02: returns five departures by default with route, direction and platform', async () => {
    const response = await departures(get('/api/transport/facilibus/departures?stationId=eglise-lieu'))
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('s-maxage=30')
    const body = await response.json()
    expect(body.status).toBe('available')
    expect(body.data.departures).toHaveLength(5)
    expect(body.data.departures[0]).toEqual(expect.objectContaining({
      route: expect.objectContaining({ shortName: '1' }),
      headsign: expect.any(String),
      quayId: expect.any(String),
      scheduledAt: expect.any(String),
    }))
    expect(body.meta.coverage).toEqual(expect.objectContaining({ partial: false }))
  })

  it('validates the station id and limit', async () => {
    expect((await departures(get('/api/transport/facilibus/departures?stationId=nope'))).status).toBe(404)
    expect((await departures(get('/api/transport/facilibus/departures?stationId=dmc&limit=50'))).status).toBe(400)
    expect((await departures(get('/api/transport/facilibus/departures'))).status).toBe(400)
  })

  it('AC-04-03: keeps scheduled times when realtime sources fail, and reports a schedule outage', async () => {
    setFacilibusProvider(provider({
      fetchStopTimes: jest.fn().mockRejectedValue(new Error('down')),
      fetchTripUpdates: jest.fn().mockRejectedValue(new Error('down')),
      fetchVehicles: jest.fn().mockRejectedValue(new Error('down')),
    }))
    const degraded = await (await departures(get('/api/transport/facilibus/departures?stationId=dmc'))).json()
    expect(degraded.status).toBe('available')
    expect(degraded.data.departures.length).toBeGreaterThan(0)
    expect(degraded.meta.freshness).toBe('unknown')

    resetTransportCache()
    setFacilibusProvider(provider({ fetchStaticFeed: jest.fn().mockRejectedValue(new Error('down')) }))
    const outage = await (await departures(get('/api/transport/facilibus/departures?stationId=dmc'))).json()
    expect(outage.status).toBe('unavailable')
  })

  it('serves the last valid schedule as stale when the source fails after expiry', async () => {
    await departures(get('/api/transport/facilibus/departures?stationId=dmc'))
    setFacilibusProvider(provider({ fetchStaticFeed: jest.fn().mockRejectedValue(new Error('down')) }))
    jest.setSystemTime(new Date('2026-10-02T10:00:00Z'))
    const body = await (await departures(get('/api/transport/facilibus/departures?stationId=dmc'))).json()
    expect(body.status).toBe('stale')
    expect(body.data.departures.length).toBeGreaterThan(0)
  })

  it('AC-04-04: never exposes plates or raw provider fields for vehicles', async () => {
    jest.setSystemTime(new Date('2026-10-02T11:40:00Z')) // position mesurée ~7 min plus tôt
    const response = await vehicles(get('/api/transport/facilibus/vehicles'))
    const text = await response.text()
    expect(text).not.toMatch(/licensePlate|AA-000-AA|device_id|675ae519bb2b7e4329bf98a2/)
    const body = JSON.parse(text)
    expect(body.data[0]).toEqual(expect.objectContaining({ network: 'facilibus', status: 'at_stop', freshness: 'stale' }))
    expect(Object.keys(body.data[0]).sort()).toEqual([
      'freshness', 'latitude', 'longitude', 'measuredAt', 'network', 'publicId', 'routeId', 'startDate', 'status', 'stopId', 'tripId',
    ])
  })

  it('057: adds real walking times to nearby stations for a guest with a stay only', async () => {
    const anonymous = await (await nearby(get('/api/transport/facilibus/nearby?lat=45.8915&lng=6.7085'))).json()
    expect(anonymous.data.stations[0].travel).toBeNull()
    expect(mockTravelTimes).not.toHaveBeenCalled()

    mockStayContext.mockResolvedValue({ lodgingId: 'lodging-1' })
    mockTravelTimes.mockImplementation(async (_origin: unknown, destinations: { id: string }[]) =>
      Object.fromEntries(destinations.map(destination => [destination.id, { walkingSeconds: 150, drivingSeconds: 90 }])))
    const response = await nearby(get('/api/transport/facilibus/nearby?lat=45.8915&lng=6.7085'))
    const body = await response.json()
    expect(body.data.stations[0].travel).toEqual({ walkingSeconds: 150, drivingSeconds: 90 })
    expect(response.headers.get('cache-control')).toContain('private')
  })

  it('057: keeps nearby stations when the travel computation fails', async () => {
    mockStayContext.mockResolvedValue({ lodgingId: 'lodging-1' })
    mockTravelTimes.mockRejectedValue(new Error('mapbox down'))
    const body = await (await nearby(get('/api/transport/facilibus/nearby?lat=45.8915&lng=6.7085'))).json()
    expect(body.status).toBe('available')
    expect(body.data.stations[0].travel).toBeNull()
  })

  it('058 AC-01-01: serves the network lines with their colours', async () => {
    const response = await lines()
    expect(response.headers.get('cache-control')).toContain('s-maxage=3600')
    const body = await response.json()
    expect(body.status).toBe('available')
    expect(body.data.lines.map((line: { routeId: string; color: string }) => [line.routeId, line.color])).toEqual([
      ['L1', '#228947'], ['L2', '#e72438'],
    ])
  })
})
