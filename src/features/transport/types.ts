/** Types métier transport (spec 055), indépendants du fournisseur technique. */

export type TransportFreshness = 'fresh' | 'stale' | 'unknown'

export type TransportStatus =
  | 'available'
  | 'no_departures'
  | 'outside_coverage'
  | 'stale'
  | 'unavailable'

export type TransportCoverage = {
  from: string
  to: string
  /** La période demandée dépasse les horaires publiés. */
  partial: boolean
}

export type TransportEnvelope<T> = {
  status: TransportStatus
  data: T
  meta: {
    fetchedAt: string
    sourceUpdatedAt: string | null
    freshness: TransportFreshness
    coverage?: TransportCoverage
  }
}

/** Quai GTFS (arrêt où l'on monte). */
export type TransportStop = {
  stopId: string
  name: string
  latitude: number
  longitude: number
  /** Au moins une course y offre un départ (hors terminus). */
  boarding: boolean
}

/** Station physique regroupant un ou plusieurs quais via `parent_station`. */
export type PhysicalStop = {
  /** Identifiant normalisé exposé aux clients. */
  id: string
  /** Identifiant source (parent ou quai isolé) — usage interne. */
  sourceId: string
  name: string
  latitude: number
  longitude: number
  quays: TransportStop[]
  routeIds: string[]
}

export type TransportRoute = {
  id: string
  shortName: string
  longName: string
  color: string | null
  textColor: string | null
}

export type DeparturePassageStatus =
  | 'scheduled'
  | 'approaching'
  | 'at_stop'
  | 'passed'
  | 'cancelled'
  | 'skipped'
  | 'unknown'

export type TransportDeparture = {
  tripId: string
  serviceDate: string
  stopSequence: number
  quayId: string
  routeId: string
  headsign: string
  scheduledAt: string
  estimatedAt: string | null
  /** Horaire exploitable : estimation fraîche, sinon horaire théorique. */
  referenceAt: string
  /** Positif = retard, négatif = avance ; null sans estimation exploitable. */
  delaySeconds: number | null
  realtime: boolean
  status: DeparturePassageStatus
  vehicleLocated: boolean
}

export type VehicleStopStatus = 'approaching' | 'at_stop' | 'in_transit' | 'unknown'

export type TransportVehicle = {
  publicId: string
  routeId: string | null
  tripId: string | null
  startDate: string | null
  latitude: number
  longitude: number
  /** Arrêt de référence : sa signification dépend de `status` (GTFS-RT). */
  stopId: string | null
  status: VehicleStopStatus
  /** Heure de mesure (secondes Unix). */
  measuredAt: number | null
}

// ─── Réponses publiques des routes /api/transport/facilibus ───

export type PublicStation = {
  id: string
  name: string
  latitude: number
  longitude: number
  routes: { shortName: string; color: string | null; textColor: string | null }[]
}

export type PublicDeparture = Omit<TransportDeparture, 'routeId'> & {
  id: string
  route: { shortName: string; color: string | null; textColor: string | null }
}

export type NearbyResult = {
  stations: (PublicStation & { distanceMeters: number })[]
  maxDistanceMeters: number
}

export type DeparturesResult = {
  station: { id: string; name: string } | null
  departures: PublicDeparture[]
}

export type PublicVehicle = TransportVehicle & { network: string; freshness: TransportFreshness }
