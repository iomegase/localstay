export type TrailCoordinate = {
  latitude: number
  longitude: number
}

export type TrailLineString = {
  type: 'LineString'
  coordinates: Array<[number, number]>
}

export type TrailMultiLineString = {
  type: 'MultiLineString'
  coordinates: Array<Array<[number, number]>>
}

export type TrailGeometry = TrailLineString | TrailMultiLineString

export type TrailNavigationData = {
  id: string
  slug: string
  name: string
  description: string | null
  start_label: string | null
  start_latitude: number
  start_longitude: number
  geometry_geojson: unknown | null
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'unknown'
  distance_km: number | null
  elevation_gain_m: number | null
  estimated_duration_min: number | null
  data_quality_status: string
  source_refs: Array<{
    type: string
    name?: string | null
    url?: string | null
    attribution: string
    used_for: string[]
  }>
}

export type TrailSessionPhase =
  | 'idle'
  | 'pre_start'
  | 'ready_to_join'
  | 'approaching'
  | 'tracking'
  | 'stopped'

export type TrailGpsHealth =
  | 'inactive'
  | 'prompting'
  | 'good'
  | 'low_accuracy'
  | 'denied'
  | 'unavailable'

export type TrailSessionPoint = TrailCoordinate & {
  accuracy: number
  timestampMs: number
  altitude: number | null
  altitudeAccuracy: number | null
}

export type TrailSessionSummary = {
  distanceM: number
  durationSeconds: number
  elevationGainM: number | null
}
