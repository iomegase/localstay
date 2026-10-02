import { z } from 'zod'
import { parseGtfsStatic } from '../lib/gtfs-static'
import { toEpochSeconds } from '../lib/time'
import { normalizeVehicles } from '../lib/vehicles'
import { readZipEntries } from '../lib/zip'
import type { StopTimeObservation, TripUpdateObservation } from '../lib/departures'
import type { TransportProvider } from './types'

const REQUEST_TIMEOUT_MS = 8_000
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024
const ALLOWED_ORIGIN = 'https://api.pysae.com'

/** Contrats vérifiés le 2026-10-02 (spec 055 Context) ; champs non documentés ignorés. */
const stopTimesSchema = z.array(z.object({
  trip_id: z.string(),
  stop_id: z.string(),
  stop_sequence: z.number().int(),
  start_date: z.string().regex(/^\d{8}$/),
  current_status: z.string().optional(),
  recorded_departure_ts: z.number().nullable().optional(),
}).passthrough())

const timeValue = z.union([z.string(), z.number()])
const tripUpdateSchema = z.object({
  header: z.object({ timestamp: timeValue.optional() }).passthrough().optional(),
  entity: z.array(z.object({
    tripUpdate: z.object({
      trip: z.object({
        tripId: z.string(),
        startDate: z.string().optional(),
        scheduleRelationship: z.string().optional(),
      }).passthrough(),
      stopTimeUpdate: z.array(z.object({
        stopSequence: z.number().int().optional(),
        stopId: z.string().optional(),
        arrival: z.object({ time: timeValue.optional() }).passthrough().optional(),
        departure: z.object({ time: timeValue.optional() }).passthrough().optional(),
        scheduleRelationship: z.string().optional(),
      }).passthrough()).default([]),
    }).passthrough().optional(),
  }).passthrough()).default([]),
}).passthrough()

async function request(url: string): Promise<Response> {
  if (!url.startsWith(`${ALLOWED_ORIGIN}/`)) throw new Error('PYSAE_URL_NOT_ALLOWED')
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), cache: 'no-store' })
  if (!response.ok) throw new Error(`PYSAE_HTTP_${response.status}`)
  const length = Number(response.headers.get('content-length') ?? 0)
  if (length > MAX_RESPONSE_BYTES) throw new Error('PYSAE_RESPONSE_TOO_LARGE')
  return response
}

async function requestJson(url: string): Promise<unknown> {
  const text = await (await request(url)).text()
  if (text.length > MAX_RESPONSE_BYTES) throw new Error('PYSAE_RESPONSE_TOO_LARGE')
  return JSON.parse(text)
}

/** Adaptateur Pysae pour un groupe (base URL fixe côté serveur, spec 055 BR-04). */
export function createPysaeProvider(groupBaseUrl: string): TransportProvider {
  return {
    async fetchStaticFeed() {
      const buffer = Buffer.from(await (await request(`${groupBaseUrl}/gtfs/pub`)).arrayBuffer())
      if (buffer.length > MAX_RESPONSE_BYTES) throw new Error('PYSAE_RESPONSE_TOO_LARGE')
      return parseGtfsStatic(readZipEntries(buffer))
    },

    async fetchStopTimes(stopId): Promise<StopTimeObservation[]> {
      const payload = await requestJson(`${groupBaseUrl}/stop-times?stop_id=${encodeURIComponent(stopId)}`)
      const parsed = stopTimesSchema.safeParse(payload)
      if (!parsed.success) throw new Error('PYSAE_STOP_TIMES_INVALID')
      return parsed.data.map(row => ({
        tripId: row.trip_id,
        serviceDate: row.start_date,
        stopId: row.stop_id,
        stopSequence: row.stop_sequence,
        passed: row.current_status === 'PASSED' || toEpochSeconds(row.recorded_departure_ts) !== null,
      }))
    },

    async fetchTripUpdates() {
      const payload = await requestJson(`${groupBaseUrl}/gtfs-rt/trip-update?format=plaintext`)
      const parsed = tripUpdateSchema.safeParse(payload)
      if (!parsed.success) throw new Error('PYSAE_TRIP_UPDATES_INVALID')
      const trips: TripUpdateObservation[] = parsed.data.entity.flatMap(entity => {
        const update = entity.tripUpdate
        if (!update) return []
        const relationship = update.trip.scheduleRelationship
        return [{
          tripId: update.trip.tripId,
          startDate: update.trip.startDate && /^\d{8}$/.test(update.trip.startDate) ? update.trip.startDate : null,
          cancelled: relationship === 'CANCELED' || relationship === 'CANCELLED',
          stops: update.stopTimeUpdate.map(stop => ({
            stopSequence: stop.stopSequence ?? null,
            stopId: stop.stopId ?? null,
            departureTs: toEpochSeconds(stop.departure?.time ?? stop.arrival?.time),
            skipped: stop.scheduleRelationship === 'SKIPPED',
          })),
        }]
      })
      return { producedAt: toEpochSeconds(parsed.data.header?.timestamp), trips }
    },

    async fetchVehicles() {
      const payload = await requestJson(`${groupBaseUrl}/gtfs-rt/vehicle-position?format=plaintext`)
      const header = (payload as { header?: { timestamp?: unknown } } | null)?.header
      return { producedAt: toEpochSeconds(header?.timestamp), vehicles: normalizeVehicles(payload) }
    },
  }
}
