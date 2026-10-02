import { cachedLoad } from './lib/cache'
import { computeDepartures, ESTIMATE_MAX_AGE_SECONDS, VEHICLE_MAX_AGE_SECONDS } from './lib/departures'
import { buildStations, findNearbyStations } from './lib/stations'
import { createPysaeProvider } from './providers/pysae'
import type { GtfsStatic } from './lib/gtfs-static'
import type { RealtimeInputs, StopTimeObservation } from './lib/departures'
import type { TransportProvider } from './providers/types'
import type {
  DeparturesResult,
  NearbyResult,
  PublicStation,
  PublicVehicle,
  PhysicalStop,
  TransportEnvelope,
  TransportFreshness,
  TransportRoute,
} from './types'

function numberFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

/** Réseau Facilibus (Saint-Gervais ↔ Saint-Nicolas-de-Véroce), fourni par Pysae. */
export const FACILIBUS = {
  id: 'facilibus',
  name: 'Facilibus',
  providerBaseUrl: 'https://api.pysae.com/api/v4/groups/saint-gervais',
  citySlugs: ['saint-gervais-les-bains', 'saint-nicolas-de-veroce'],
  nearbyMaxMeters: numberFromEnv('FACILIBUS_NEARBY_MAX_METERS', 800),
  windowHours: 24,
  defaultLimit: 5,
  maxLimit: 10,
  ttlMs: { static: 3_600_000, passages: 30_000, vehicles: 15_000 },
  maxStaleMs: { static: 24 * 3_600_000, passages: 5 * 60_000, vehicles: 2 * 60_000 },
} as const

let provider: TransportProvider = createPysaeProvider(FACILIBUS.providerBaseUrl)

/** Réservé aux tests. */
export function setFacilibusProvider(next: TransportProvider) {
  provider = next
}

export function isFacilibusCity(citySlug: string): boolean {
  return (FACILIBUS.citySlugs as readonly string[]).includes(citySlug)
}

type StaticData = { gtfs: GtfsStatic; stations: PhysicalStop[] }

async function loadStatic() {
  return cachedLoad<StaticData>(
    'facilibus:static',
    FACILIBUS.ttlMs.static,
    async () => {
      const gtfs = await provider.fetchStaticFeed()
      return { gtfs, stations: buildStations(gtfs).filter(station => station.quays.some(quay => quay.boarding)) }
    },
    FACILIBUS.maxStaleMs.static,
  )
}

const isoOf = (milliseconds: number) => new Date(milliseconds).toISOString()

function logFailure(source: string, error: unknown) {
  console.error('[transport:facilibus] source unavailable', { source, reason: error instanceof Error ? error.message : 'unknown' })
}

function routeLookup(routes: TransportRoute[]) {
  const byId = new Map(routes.map(route => [route.id, route]))
  return (routeId: string) => {
    const route = byId.get(routeId)
    return { shortName: route?.shortName ?? routeId, color: route?.color ?? null, textColor: route?.textColor ?? null }
  }
}

function toPublicStation(station: PhysicalStop, routes: TransportRoute[]): PublicStation {
  const route = routeLookup(routes)
  return {
    id: station.id,
    name: station.name,
    latitude: station.latitude,
    longitude: station.longitude,
    routes: station.routeIds.map(route),
  }
}

export async function getFacilibusStations(): Promise<TransportEnvelope<PublicStation[]>> {
  try {
    const loaded = await loadStatic()
    return {
      status: loaded.stale ? 'stale' : 'available',
      data: loaded.value.stations.map(station => toPublicStation(station, loaded.value.gtfs.routes)),
      meta: { fetchedAt: isoOf(loaded.fetchedAt), sourceUpdatedAt: null, freshness: loaded.stale ? 'stale' : 'unknown' },
    }
  } catch (error) {
    logFailure('static', error)
    return { status: 'unavailable', data: [], meta: { fetchedAt: isoOf(Date.now()), sourceUpdatedAt: null, freshness: 'unknown' } }
  }
}

export async function getFacilibusNearby(latitude: number, longitude: number): Promise<TransportEnvelope<NearbyResult>> {
  const empty: NearbyResult = { stations: [], maxDistanceMeters: FACILIBUS.nearbyMaxMeters }
  try {
    const loaded = await loadStatic()
    const nearby = findNearbyStations(loaded.value.stations, latitude, longitude, FACILIBUS.nearbyMaxMeters)
    return {
      status: nearby.length === 0 ? 'outside_coverage' : loaded.stale ? 'stale' : 'available',
      data: {
        ...empty,
        stations: nearby.map(item => ({
          ...toPublicStation(item.station, loaded.value.gtfs.routes),
          distanceMeters: item.distanceMeters,
        })),
      },
      meta: { fetchedAt: isoOf(loaded.fetchedAt), sourceUpdatedAt: null, freshness: loaded.stale ? 'stale' : 'unknown' },
    }
  } catch (error) {
    logFailure('static', error)
    return { status: 'unavailable', data: empty, meta: { fetchedAt: isoOf(Date.now()), sourceUpdatedAt: null, freshness: 'unknown' } }
  }
}

/**
 * Prochains passages d'une station physique (tous quais). Les pannes du temps
 * réel dégradent vers les horaires théoriques (spec 055 AC-04-03).
 */
export async function getFacilibusDepartures(
  stationId: string,
  limit: number,
  now: Date = new Date(),
): Promise<TransportEnvelope<DeparturesResult> | null> {
  let loaded
  try {
    loaded = await loadStatic()
  } catch (error) {
    logFailure('static', error)
    return {
      status: 'unavailable',
      data: { station: null, departures: [] },
      meta: { fetchedAt: isoOf(now.getTime()), sourceUpdatedAt: null, freshness: 'unknown' },
    }
  }

  const station = loaded.value.stations.find(candidate => candidate.id === stationId)
  if (!station) return null

  const [stopTimes, tripUpdates, vehicles] = await Promise.allSettled([
    Promise.all(station.quays.map(quay => cachedLoad<StopTimeObservation[]>(
      `facilibus:stop-times:${quay.stopId}`,
      FACILIBUS.ttlMs.passages,
      () => provider.fetchStopTimes(quay.stopId),
      FACILIBUS.maxStaleMs.passages,
    ))),
    cachedLoad('facilibus:trip-updates', FACILIBUS.ttlMs.passages, () => provider.fetchTripUpdates(), FACILIBUS.maxStaleMs.passages),
    cachedLoad('facilibus:vehicles', FACILIBUS.ttlMs.vehicles, () => provider.fetchVehicles(), FACILIBUS.maxStaleMs.vehicles),
  ])
  if (stopTimes.status === 'rejected') logFailure('stop-times', stopTimes.reason)
  if (tripUpdates.status === 'rejected') logFailure('trip-updates', tripUpdates.reason)
  if (vehicles.status === 'rejected') logFailure('vehicles', vehicles.reason)

  const realtime: RealtimeInputs = {
    stopTimes: stopTimes.status === 'fulfilled' ? stopTimes.value.flatMap(entry => entry.value) : [],
    tripUpdates: tripUpdates.status === 'fulfilled' ? tripUpdates.value.value : null,
    vehicles: vehicles.status === 'fulfilled' ? vehicles.value.value.vehicles : [],
  }
  const { departures, coverage } = computeDepartures(
    loaded.value.gtfs,
    station,
    now,
    { windowHours: FACILIBUS.windowHours, limit },
    realtime,
  )

  const producedAt = realtime.tripUpdates?.producedAt ?? null
  const nowSeconds = now.getTime() / 1000
  const freshness: TransportFreshness =
    producedAt === null ? 'unknown' : nowSeconds - producedAt <= ESTIMATE_MAX_AGE_SECONDS ? 'fresh' : 'stale'
  const route = routeLookup(loaded.value.gtfs.routes)

  return {
    status: loaded.stale ? 'stale' : departures.length > 0 ? 'available' : 'no_departures',
    data: {
      station: { id: station.id, name: station.name },
      departures: departures.map(({ routeId, ...departure }) => ({
        ...departure,
        id: `${departure.tripId}:${departure.serviceDate}:${departure.stopSequence}:${departure.quayId}`,
        route: route(routeId),
      })),
    },
    meta: {
      fetchedAt: isoOf(loaded.fetchedAt),
      sourceUpdatedAt: producedAt !== null ? isoOf(producedAt * 1000) : null,
      freshness,
      coverage,
    },
  }
}

// Une mesure datée dans le futur (horloge source) n'est pas une mesure récente.
const CLOCK_SKEW_SECONDS = 60

function vehicleFreshness(measuredAt: number | null, nowSeconds: number): TransportFreshness {
  if (measuredAt === null || measuredAt - nowSeconds > CLOCK_SKEW_SECONDS) return 'unknown'
  return nowSeconds - measuredAt <= VEHICLE_MAX_AGE_SECONDS ? 'fresh' : 'stale'
}

export async function getFacilibusVehicles(now: Date = new Date()): Promise<TransportEnvelope<PublicVehicle[]>> {
  try {
    const loaded = await cachedLoad(
      'facilibus:vehicles',
      FACILIBUS.ttlMs.vehicles,
      () => provider.fetchVehicles(),
      FACILIBUS.maxStaleMs.vehicles,
    )
    const nowSeconds = now.getTime() / 1000
    const vehicles: PublicVehicle[] = loaded.value.vehicles.map(vehicle => ({
      publicId: vehicle.publicId,
      network: FACILIBUS.id,
      routeId: vehicle.routeId,
      tripId: vehicle.tripId,
      startDate: vehicle.startDate,
      latitude: vehicle.latitude,
      longitude: vehicle.longitude,
      stopId: vehicle.stopId,
      status: vehicle.status,
      measuredAt: vehicle.measuredAt,
      freshness: vehicleFreshness(vehicle.measuredAt, nowSeconds),
    }))
    const producedAt = loaded.value.producedAt
    return {
      status: loaded.stale ? 'stale' : 'available',
      data: vehicles,
      meta: {
        fetchedAt: isoOf(loaded.fetchedAt),
        sourceUpdatedAt: producedAt !== null ? isoOf(producedAt * 1000) : null,
        freshness: vehicles.some(vehicle => vehicle.freshness === 'fresh') ? 'fresh' : vehicles.length > 0 ? 'stale' : 'unknown',
      },
    }
  } catch (error) {
    logFailure('vehicles', error)
    return { status: 'unavailable', data: [], meta: { fetchedAt: isoOf(now.getTime()), sourceUpdatedAt: null, freshness: 'unknown' } }
  }
}
