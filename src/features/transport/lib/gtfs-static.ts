import { parseCsv } from './csv'
import { parseGtfsTime } from './time'
import type { TransportRoute } from '../types'

export type GtfsStop = {
  stopId: string
  name: string
  latitude: number
  longitude: number
  locationType: number
  parentStation: string | null
}

export type GtfsTrip = {
  tripId: string
  routeId: string
  serviceId: string
  headsign: string
}

export type GtfsStopTime = {
  tripId: string
  stopId: string
  stopSequence: number
  departureSeconds: number
  /** Montée possible (pickup_type ≠ 1) et pas le dernier arrêt de la course. */
  boarding: boolean
}

export type GtfsCalendar = {
  serviceId: string
  startDate: string
  endDate: string
  weekdays: boolean[] // index 0 = dimanche
}

export type GtfsStatic = {
  timezone: string
  stops: GtfsStop[]
  routes: TransportRoute[]
  trips: Map<string, GtfsTrip>
  stopTimesByStop: Map<string, GtfsStopTime[]>
  calendars: GtfsCalendar[]
  /** service_id → date → 1 (ajout) | 2 (suppression). */
  calendarDates: Map<string, Map<string, 1 | 2>>
}

const WEEKDAY_COLUMNS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function required(entries: Map<string, string>, name: string): Record<string, string>[] {
  const content = entries.get(name)
  if (content === undefined) throw new Error(`GTFS_MISSING_${name}`)
  return parseCsv(content)
}

const color = (value: string | undefined) => (value && /^[0-9a-fA-F]{6}$/.test(value) ? `#${value}` : null)

export function parseGtfsStatic(entries: Map<string, string>): GtfsStatic {
  const agency = required(entries, 'agency.txt')[0]
  const stops: GtfsStop[] = required(entries, 'stops.txt').flatMap(row => {
    const latitude = Number(row.stop_lat)
    const longitude = Number(row.stop_lon)
    if (!row.stop_id || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return []
    return [{
      stopId: row.stop_id,
      name: row.stop_name || row.stop_id,
      latitude,
      longitude,
      locationType: Number(row.location_type || 0),
      parentStation: row.parent_station || null,
    }]
  })

  const routes: TransportRoute[] = required(entries, 'routes.txt').map(row => ({
    id: row.route_id,
    shortName: row.route_short_name || row.route_id,
    longName: row.route_long_name,
    color: color(row.route_color),
    textColor: color(row.route_text_color),
  }))

  const trips = new Map<string, GtfsTrip>()
  for (const row of required(entries, 'trips.txt')) {
    trips.set(row.trip_id, {
      tripId: row.trip_id,
      routeId: row.route_id,
      serviceId: row.service_id,
      headsign: row.trip_headsign,
    })
  }

  const byTrip = new Map<string, (GtfsStopTime & { pickupType: string })[]>()
  for (const row of required(entries, 'stop_times.txt')) {
    const departureSeconds = parseGtfsTime(row.departure_time || row.arrival_time)
    if (departureSeconds === null || !trips.has(row.trip_id)) continue
    const list = byTrip.get(row.trip_id) ?? []
    list.push({
      tripId: row.trip_id,
      stopId: row.stop_id,
      stopSequence: Number(row.stop_sequence),
      departureSeconds,
      boarding: true,
      pickupType: row.pickup_type,
    })
    byTrip.set(row.trip_id, list)
  }

  const stopTimesByStop = new Map<string, GtfsStopTime[]>()
  for (const list of byTrip.values()) {
    list.sort((a, b) => a.stopSequence - b.stopSequence)
    list.forEach((stopTime, index) => {
      const { pickupType, ...rest } = stopTime
      const entry: GtfsStopTime = { ...rest, boarding: pickupType !== '1' && index < list.length - 1 }
      const forStop = stopTimesByStop.get(entry.stopId) ?? []
      forStop.push(entry)
      stopTimesByStop.set(entry.stopId, forStop)
    })
  }

  const calendars: GtfsCalendar[] = (entries.has('calendar.txt') ? parseCsv(entries.get('calendar.txt') as string) : [])
    .map(row => ({
      serviceId: row.service_id,
      startDate: row.start_date,
      endDate: row.end_date,
      weekdays: WEEKDAY_COLUMNS.map(column => row[column] === '1'),
    }))

  const calendarDates = new Map<string, Map<string, 1 | 2>>()
  if (entries.has('calendar_dates.txt')) {
    for (const row of parseCsv(entries.get('calendar_dates.txt') as string)) {
      if (row.exception_type !== '1' && row.exception_type !== '2') continue
      const forService = calendarDates.get(row.service_id) ?? new Map<string, 1 | 2>()
      forService.set(row.date, row.exception_type === '1' ? 1 : 2)
      calendarDates.set(row.service_id, forService)
    }
  }

  return {
    timezone: agency?.agency_timezone || 'Europe/Paris',
    stops,
    routes,
    trips,
    stopTimesByStop,
    calendars,
    calendarDates,
  }
}

/** Le service circule-t-il à cette date (« YYYYMMDD ») ? */
export function isServiceActive(gtfs: GtfsStatic, serviceId: string, serviceDate: string): boolean {
  const exception = gtfs.calendarDates.get(serviceId)?.get(serviceDate)
  if (exception === 1) return true
  if (exception === 2) return false
  const weekday = new Date(
    Date.UTC(Number(serviceDate.slice(0, 4)), Number(serviceDate.slice(4, 6)) - 1, Number(serviceDate.slice(6, 8))),
  ).getUTCDay()
  return gtfs.calendars.some(
    calendar =>
      calendar.serviceId === serviceId &&
      calendar.startDate <= serviceDate &&
      serviceDate <= calendar.endDate &&
      calendar.weekdays[weekday],
  )
}

/** Dernière date de service publiée (calendrier + ajouts). */
export function lastPublishedServiceDate(gtfs: GtfsStatic): string | null {
  const dates = [
    ...gtfs.calendars.map(calendar => calendar.endDate),
    ...[...gtfs.calendarDates.values()].flatMap(map =>
      [...map.entries()].filter(([, type]) => type === 1).map(([date]) => date),
    ),
  ]
  return dates.length > 0 ? dates.sort().at(-1) ?? null : null
}
