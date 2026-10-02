import { isServiceActive, lastPublishedServiceDate, type GtfsStatic } from './gtfs-static'
import { parisServiceDate, serviceDayStart } from './time'
import type {
  DeparturePassageStatus,
  PhysicalStop,
  TransportCoverage,
  TransportDeparture,
  TransportVehicle,
} from '../types'

/** Passage observé par le fournisseur pour la journée en cours. */
export type StopTimeObservation = {
  tripId: string
  serviceDate: string
  stopId: string
  stopSequence: number
  /** Départ enregistré ou état confirmé « PASSED ». */
  passed: boolean
}

export type TripUpdateStop = {
  stopSequence: number | null
  stopId: string | null
  departureTs: number | null
  skipped: boolean
}

export type TripUpdateObservation = {
  tripId: string
  startDate: string | null
  cancelled: boolean
  stops: TripUpdateStop[]
}

export type RealtimeInputs = {
  stopTimes: StopTimeObservation[]
  tripUpdates: { producedAt: number | null; trips: TripUpdateObservation[] } | null
  vehicles: TransportVehicle[]
}

export type DepartureOptions = {
  windowHours: number
  limit: number
  /** Âge maximal (s) d'une estimation pour être affichée comme temps réel. */
  estimateMaxAgeSeconds?: number
  /** Âge maximal (s) d'une position de navette. */
  vehicleMaxAgeSeconds?: number
}

export const ESTIMATE_MAX_AGE_SECONDS = 90
export const VEHICLE_MAX_AGE_SECONDS = 120
// Sans date de course dans le flux, une estimation n'est rattachée qu'à
// l'instance dont l'horaire théorique est à moins de 2 h.
const INSTANCE_MATCH_WINDOW_SECONDS = 2 * 3600
const LATE_LOOKBACK_SECONDS = 2 * 3600
const CLOCK_SKEW_SECONDS = 60

export function departureKey(departure: Pick<TransportDeparture, 'tripId' | 'serviceDate' | 'quayId' | 'stopSequence'>): string {
  return `${departure.tripId}|${departure.serviceDate}|${departure.quayId}|${departure.stopSequence}`
}

const iso = (seconds: number) => new Date(seconds * 1000).toISOString()

function nextDate(serviceDate: string): string {
  const date = new Date(Date.UTC(Number(serviceDate.slice(0, 4)), Number(serviceDate.slice(4, 6)) - 1, Number(serviceDate.slice(6, 8)) + 1))
  return date.toISOString().slice(0, 10).replaceAll('-', '')
}

/**
 * Prochains départs d'une station physique sur la fenêtre demandée (spec 055
 * AC-02-02..05) : tous les quais, horaires par date de service, exclusion des
 * passages effectués / annulés / non desservis, déduplication, tri, limite.
 */
export function computeDepartures(
  gtfs: GtfsStatic,
  station: PhysicalStop,
  now: Date,
  options: DepartureOptions,
  realtime: RealtimeInputs,
): { departures: TransportDeparture[]; coverage: TransportCoverage } {
  const nowSeconds = Math.floor(now.getTime() / 1000)
  const endSeconds = nowSeconds + options.windowHours * 3600
  const estimateMaxAge = options.estimateMaxAgeSeconds ?? ESTIMATE_MAX_AGE_SECONDS
  const vehicleMaxAge = options.vehicleMaxAgeSeconds ?? VEHICLE_MAX_AGE_SECONDS
  const today = parisServiceDate(now)

  const passed = new Set(
    realtime.stopTimes.filter(observation => observation.passed).map(observation => departureKey({
      tripId: observation.tripId,
      serviceDate: observation.serviceDate,
      quayId: observation.stopId,
      stopSequence: observation.stopSequence,
    })),
  )
  const producedAt = realtime.tripUpdates?.producedAt ?? null
  const estimatesFresh =
    producedAt !== null && producedAt - nowSeconds <= CLOCK_SKEW_SECONDS && nowSeconds - producedAt <= estimateMaxAge
  const tripUpdates = realtime.tripUpdates?.trips ?? []
  const freshVehicles = realtime.vehicles.filter(
    vehicle =>
      vehicle.measuredAt !== null &&
      vehicle.measuredAt - nowSeconds <= CLOCK_SKEW_SECONDS &&
      nowSeconds - vehicle.measuredAt <= vehicleMaxAge,
  )

  const departures = new Map<string, TransportDeparture>()
  const serviceDates = [parisServiceDate(now, -1), today, parisServiceDate(now, 1)]

  for (const serviceDate of serviceDates) {
    const base = Math.floor(serviceDayStart(serviceDate).getTime() / 1000)
    for (const quay of station.quays) {
      for (const stopTime of gtfs.stopTimesByStop.get(quay.stopId) ?? []) {
        if (!stopTime.boarding) continue
        const trip = gtfs.trips.get(stopTime.tripId)
        if (!trip || !isServiceActive(gtfs, trip.serviceId, serviceDate)) continue

        const scheduled = base + stopTime.departureSeconds
        if (scheduled < nowSeconds - LATE_LOOKBACK_SECONDS || scheduled > endSeconds) continue

        const key = departureKey({ tripId: trip.tripId, serviceDate, quayId: quay.stopId, stopSequence: stopTime.stopSequence })
        if (departures.has(key) || passed.has(key)) continue

        const update = tripUpdates.find(candidate =>
          candidate.tripId === trip.tripId &&
          (candidate.startDate ? candidate.startDate === serviceDate : true),
        )
        const stopUpdate = update?.stops.find(stop =>
          stop.stopSequence !== null ? stop.stopSequence === stopTime.stopSequence : stop.stopId === quay.stopId,
        )
        const sameInstance = (estimate: number) =>
          update?.startDate ? true : Math.abs(estimate - scheduled) <= INSTANCE_MATCH_WINDOW_SECONDS
        if (update?.cancelled && (update.startDate || serviceDate === today)) continue
        if (stopUpdate?.skipped && (update?.startDate || serviceDate === today)) continue

        const estimate =
          estimatesFresh && stopUpdate?.departureTs && sameInstance(stopUpdate.departureTs)
            ? stopUpdate.departureTs
            : null
        const reference = estimate ?? scheduled
        if (reference < nowSeconds || reference > endSeconds) continue

        const vehicle = freshVehicles.find(candidate =>
          candidate.tripId === trip.tripId &&
          (candidate.startDate ? candidate.startDate === serviceDate : serviceDate === today),
        )
        let status: DeparturePassageStatus = 'scheduled'
        if (vehicle && vehicle.stopId === quay.stopId) {
          if (vehicle.status === 'at_stop') status = 'at_stop'
          else if (vehicle.status === 'approaching') status = 'approaching'
        }

        departures.set(key, {
          tripId: trip.tripId,
          serviceDate,
          stopSequence: stopTime.stopSequence,
          quayId: quay.stopId,
          routeId: trip.routeId,
          headsign: trip.headsign,
          scheduledAt: iso(scheduled),
          estimatedAt: estimate !== null ? iso(estimate) : null,
          referenceAt: iso(reference),
          delaySeconds: estimate !== null ? estimate - scheduled : null,
          realtime: estimate !== null,
          status,
          vehicleLocated: Boolean(vehicle),
        })
      }
    }
  }

  const lastDate = lastPublishedServiceDate(gtfs)
  const coverageEnd = lastDate ? Math.floor(serviceDayStart(nextDate(lastDate)).getTime() / 1000) : nowSeconds
  const coverage: TransportCoverage = {
    from: iso(nowSeconds),
    to: iso(Math.max(nowSeconds, Math.min(endSeconds, coverageEnd))),
    partial: coverageEnd < endSeconds,
  }

  return {
    departures: [...departures.values()]
      .sort((a, b) => a.referenceAt.localeCompare(b.referenceAt) || a.routeId.localeCompare(b.routeId))
      .slice(0, options.limit),
    coverage,
  }
}
