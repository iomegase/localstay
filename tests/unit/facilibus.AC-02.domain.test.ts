/** @jest-environment node */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { haversineMeters } from '@/features/transport/lib/geo'
import { readZipEntries } from '@/features/transport/lib/zip'
import { parseCsv } from '@/features/transport/lib/csv'
import { parseGtfsStatic } from '@/features/transport/lib/gtfs-static'
import { buildStations, displayStopName, findNearbyStations } from '@/features/transport/lib/stations'
import { serviceDayStart, formatParisTime, toEpochSeconds } from '@/features/transport/lib/time'
import { computeDepartures, departureKey } from '@/features/transport/lib/departures'
import { normalizeVehicles } from '@/features/transport/lib/vehicles'
import type { RealtimeInputs } from '@/features/transport/lib/departures'

const fixture = (name: string) => readFileSync(path.join(__dirname, '../fixtures/facilibus', name))
const gtfs = parseGtfsStatic(readZipEntries(fixture('gtfs-pub.zip')))
const stations = buildStations(gtfs)
const noRealtime: RealtimeInputs = { stopTimes: [], tripUpdates: null, vehicles: [] }

// 2026-10-02 10:00 Europe/Paris (UTC+2).
const NOW = new Date('2026-10-02T08:00:00Z')

describe('055 transport domain — geography and parsing', () => {
  it('computes Haversine distances in meters', () => {
    expect(haversineMeters(45.890476, 6.70726, 45.890476, 6.70726)).toBe(0)
    // ~111,2 km par degré de latitude.
    expect(Math.round(haversineMeters(45, 6, 46, 6) / 100)).toBe(1112)
  })

  it('reads the GTFS archive and quoted CSV values', () => {
    expect(gtfs.routes.map(route => route.shortName)).toEqual(['1', '2'])
    expect(gtfs.timezone).toBe('Europe/Paris')
    expect(parseCsv('a,b\n"x, y",2\n')).toEqual([{ a: 'x, y', b: '2' }])
  })
})

describe('055 BR-02 — stations and platforms', () => {
  it('groups platforms only through parent_station and keeps every platform id', () => {
    const eglise = stations.find(station => station.sourceId === 'EGLISE_lieu')
    expect(eglise?.quays.map(quay => quay.stopId).sort()).toEqual(['EGLISE', 'EGLISE_R'])
    expect(eglise?.name).toBe('Eglise de Saint Nicolas')
  })

  it('never merges stops on name or the _R suffix alone', () => {
    const dmc = stations.find(station => station.sourceId === 'DMC')
    expect(dmc?.quays.map(quay => quay.stopId)).toEqual(['DMC'])
    // Aucun parent : « LA PISCINE » reste seule.
    expect(stations.filter(station => station.quays.some(quay => quay.stopId === 'LA PISCINE'))).toHaveLength(1)
    expect(new Set(stations.map(station => station.id)).size).toBe(stations.length)
  })

  it('formats official names for display without changing ids', () => {
    expect(displayStopName('TÉLÉCABINE DE SAINT GERVAIS/LE CHATELET')).toBe('Télécabine de Saint Gervais / Le Chatelet')
  })

  it('finds up to three nearby stations from the nearest boarding platform', () => {
    const nearby = findNearbyStations(stations, 45.8915, 6.7085, 800)
    expect(nearby.length).toBeGreaterThan(0)
    expect(nearby.length).toBeLessThanOrEqual(3)
    expect(nearby[0].station.sourceId).toBe('DMC')
    expect(nearby[0].distanceMeters).toBeLessThan(200)
    expect(findNearbyStations(stations, 48.85, 2.35, 800)).toEqual([])
  })
})

describe('055 BR-03 — service days and Europe/Paris', () => {
  it('anchors service days on noon minus 12 h across DST changes', () => {
    // 25/10/2026 : passage à l'heure d'hiver (journée de 25 h).
    expect(serviceDayStart('20261025').toISOString()).toBe('2026-10-24T23:00:00.000Z')
    expect(serviceDayStart('20261002').toISOString()).toBe('2026-10-01T22:00:00.000Z')
  })

  it('formats instants in Europe/Paris whatever the server timezone', () => {
    expect(formatParisTime('2026-10-02T04:50:00.000Z')).toBe('06:50')
  })

  it('normalizes Unix seconds or milliseconds and rejects invalid values', () => {
    expect(toEpochSeconds('1790940811')).toBe(1790940811)
    expect(toEpochSeconds(1790940811000)).toBe(1790940811)
    expect(toEpochSeconds('abc')).toBeNull()
    expect(toEpochSeconds(0)).toBeNull()
  })
})

describe('055 AC-02-02..05 — departures', () => {
  const dmc = () => stations.find(station => station.sourceId === 'DMC')!
  const eglise = () => stations.find(station => station.sourceId === 'EGLISE_lieu')!

  it('aggregates every platform, keeps each direction, sorts and limits', () => {
    const result = computeDepartures(gtfs, eglise(), NOW, { windowHours: 24, limit: 5 }, noRealtime)
    expect(result.departures).toHaveLength(5)
    const times = result.departures.map(departure => departure.referenceAt)
    expect([...times].sort()).toEqual(times)
    expect(new Set(result.departures.map(departure => departure.quayId)).size).toBeGreaterThan(1)
    expect(result.departures.every(departure => departure.headsign.length > 0)).toBe(true)
    expect(result.departures[0].scheduledAt >= NOW.toISOString()).toBe(true)
  })

  it('never offers a departure at the terminus of a trip', () => {
    const result = computeDepartures(gtfs, dmc(), NOW, { windowHours: 24, limit: 50 }, noRealtime)
    expect(result.departures.every(departure => departure.headsign !== 'Télécabine de Saint Gervais')).toBe(true)
  })

  it('uses the right service date for tomorrow and reports partial coverage', () => {
    const lateEvening = new Date('2026-10-02T19:00:00Z') // 21:00 Paris, après le dernier passage.
    const result = computeDepartures(gtfs, dmc(), lateEvening, { windowHours: 24, limit: 1 }, noRealtime)
    expect(result.departures[0].serviceDate).toBe('20261003')
    expect(formatParisTime(result.departures[0].scheduledAt)).toBe('06:50')

    const endOfCalendar = new Date('2026-12-18T20:00:00Z') // 21:00 Paris (UTC+1)
    const partial = computeDepartures(gtfs, dmc(), endOfCalendar, { windowHours: 24, limit: 5 }, noRealtime)
    expect(partial.departures).toEqual([])
    expect(partial.coverage.partial).toBe(true)
  })

  it('excludes a recorded passage even when its schedule is still in the future', () => {
    const base = computeDepartures(gtfs, eglise(), NOW, { windowHours: 24, limit: 1 }, noRealtime).departures[0]
    const realtime: RealtimeInputs = {
      ...noRealtime,
      stopTimes: [{
        tripId: base.tripId, serviceDate: base.serviceDate, stopId: base.quayId, stopSequence: base.stopSequence,
        passed: true,
      }],
    }
    const next = computeDepartures(gtfs, eglise(), NOW, { windowHours: 24, limit: 1 }, realtime).departures[0]
    expect(departureKey(next)).not.toBe(departureKey(base))
  })

  it('applies fresh estimates with signed delay and ignores stale ones', () => {
    const base = computeDepartures(gtfs, eglise(), NOW, { windowHours: 24, limit: 1 }, noRealtime).departures[0]
    const scheduled = Date.parse(base.scheduledAt) / 1000
    const update = (delay: number, producedAt: number): RealtimeInputs => ({
      ...noRealtime,
      tripUpdates: {
        producedAt,
        trips: [{
          tripId: base.tripId, startDate: null, cancelled: false,
          stops: [{ stopSequence: base.stopSequence, stopId: base.quayId, departureTs: scheduled + delay, skipped: false }],
        }],
      },
    })
    const nowTs = NOW.getTime() / 1000

    const late = computeDepartures(gtfs, eglise(), NOW, { windowHours: 24, limit: 1 }, update(120, nowTs - 30)).departures[0]
    expect(late).toMatchObject({ realtime: true, delaySeconds: 120 })
    const early = computeDepartures(gtfs, eglise(), NOW, { windowHours: 24, limit: 1 }, update(-60, nowTs - 30)).departures[0]
    expect(early.delaySeconds).toBe(-60)
    const stale = computeDepartures(gtfs, eglise(), NOW, { windowHours: 24, limit: 1 }, update(120, nowTs - 600)).departures[0]
    expect(stale).toMatchObject({ realtime: false, estimatedAt: null, delaySeconds: null })
  })

  it('excludes cancelled trips and skipped stops', () => {
    const base = computeDepartures(gtfs, eglise(), NOW, { windowHours: 24, limit: 1 }, noRealtime).departures[0]
    const nowTs = NOW.getTime() / 1000
    const cancelled: RealtimeInputs = {
      ...noRealtime,
      tripUpdates: { producedAt: nowTs, trips: [{ tripId: base.tripId, startDate: base.serviceDate, cancelled: true, stops: [] }] },
    }
    const next = computeDepartures(gtfs, eglise(), NOW, { windowHours: 24, limit: 1 }, cancelled).departures[0]
    expect(next.tripId).not.toBe(base.tripId)
  })

  it('links a fresh vehicle only to the matching trip instance', () => {
    const base = computeDepartures(gtfs, eglise(), NOW, { windowHours: 24, limit: 2 }, noRealtime).departures
    const nowTs = NOW.getTime() / 1000
    const realtime: RealtimeInputs = {
      ...noRealtime,
      vehicles: [{
        publicId: 'v1', routeId: base[0].routeId, tripId: base[0].tripId, startDate: null,
        latitude: 45.86, longitude: 6.72, stopId: base[0].quayId, status: 'approaching',
        measuredAt: nowTs - 20,
      }],
    }
    const [first, second] = computeDepartures(gtfs, eglise(), NOW, { windowHours: 24, limit: 2 }, realtime).departures
    expect(first.vehicleLocated).toBe(true)
    expect(first.status).toBe('approaching')
    expect(second.vehicleLocated).toBe(false)
  })
})

describe('055 AC-04-04 — vehicles', () => {
  it('drops plates and device ids and uses an opaque id', () => {
    const raw = JSON.parse(fixture('vehicle-position.json').toString())
    const vehicles = normalizeVehicles(raw)
    expect(vehicles).toHaveLength(1)
    const serialized = JSON.stringify(vehicles)
    expect(serialized).not.toMatch(/AA-000-AA|licensePlate|675ae519bb2b7e4329bf98a2/)
    expect(vehicles[0]).toMatchObject({ routeId: 'L1', tripId: 'L1A_7', stopId: 'DMC', status: 'at_stop', measuredAt: 1790940807 })
  })
})
