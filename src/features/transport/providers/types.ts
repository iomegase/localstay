import type { GtfsStatic } from '../lib/gtfs-static'
import type { StopTimeObservation, TripUpdateObservation } from '../lib/departures'
import type { TransportVehicle } from '../types'

/** Fournisseur technique (ex. Pysae), distinct du réseau (ex. Facilibus). */
export interface TransportProvider {
  fetchStaticFeed(): Promise<GtfsStatic>
  /** Passages observés pour la journée de service en cours (selon le fournisseur). */
  fetchStopTimes(stopId: string): Promise<StopTimeObservation[]>
  fetchTripUpdates(): Promise<{ producedAt: number | null; trips: TripUpdateObservation[] }>
  fetchVehicles(): Promise<{ producedAt: number | null; vehicles: TransportVehicle[] }>
}
