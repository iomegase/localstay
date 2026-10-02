import { createHash } from 'node:crypto'
import { z } from 'zod'
import { isValidCoordinate } from './geo'
import { toEpochSeconds } from './time'
import type { TransportVehicle, VehicleStopStatus } from '../types'

// GTFS-RT VehiclePosition (JSON) : seuls les champs utiles sont lus ; la plaque
// et les identifiants de boîtier ne sont jamais recopiés (spec 055 AC-04-04).
const vehicleFeedSchema = z.object({
  header: z.object({ timestamp: z.union([z.string(), z.number()]).optional() }).passthrough().optional(),
  entity: z.array(z.object({
    id: z.string().optional(),
    vehicle: z.object({
      trip: z.object({
        tripId: z.string().optional(),
        routeId: z.string().optional(),
        startDate: z.string().optional(),
      }).passthrough().optional(),
      position: z.object({ latitude: z.number(), longitude: z.number() }).passthrough().optional(),
      currentStatus: z.string().optional(),
      timestamp: z.union([z.string(), z.number()]).optional(),
      stopId: z.string().optional(),
      vehicle: z.object({ id: z.string().optional() }).passthrough().optional(),
    }).passthrough().optional(),
  }).passthrough()).default([]),
}).passthrough()

// Statuts GTFS-RT standard (VehicleStopStatus) → états métier.
const STATUS_MAP: Record<string, VehicleStopStatus> = {
  INCOMING_AT: 'approaching',
  STOPPED_AT: 'at_stop',
  IN_TRANSIT_TO: 'in_transit',
}

function opaqueId(rawId: string): string {
  return createHash('sha256').update(`mystay-vehicle:${rawId}`).digest('hex').slice(0, 12)
}

export function normalizeVehicles(payload: unknown): TransportVehicle[] {
  const parsed = vehicleFeedSchema.safeParse(payload)
  if (!parsed.success) throw new Error('VEHICLE_FEED_INVALID')

  return parsed.data.entity.flatMap(entity => {
    const vehicle = entity.vehicle
    const position = vehicle?.position
    const rawId = vehicle?.vehicle?.id ?? entity.id
    if (!vehicle || !position || !rawId || !isValidCoordinate(position.latitude, position.longitude)) return []
    const startDate = vehicle.trip?.startDate
    return [{
      publicId: opaqueId(rawId),
      routeId: vehicle.trip?.routeId ?? null,
      tripId: vehicle.trip?.tripId ?? null,
      startDate: startDate && /^\d{8}$/.test(startDate) ? startDate : null,
      latitude: position.latitude,
      longitude: position.longitude,
      stopId: vehicle.stopId ?? null,
      status: (vehicle.currentStatus && STATUS_MAP[vehicle.currentStatus]) || 'unknown',
      measuredAt: toEpochSeconds(vehicle.timestamp),
    }]
  })
}
