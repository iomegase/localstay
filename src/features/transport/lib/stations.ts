import { haversineMeters } from './geo'
import type { GtfsStatic } from './gtfs-static'
import type { PhysicalStop, TransportStop } from '../types'

const LOWERCASE_WORDS = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'et', 'à', 'au', 'aux', 'sur', 'en'])

/** Libellé soigné d'un nom officiel en capitales, sans toucher aux identifiants. */
export function displayStopName(official: string): string {
  return official
    .trim()
    .replace(/\s*\/\s*/g, ' / ')
    .toLocaleLowerCase('fr-FR')
    .split(/\s+/)
    .map((word, index, words) =>
      index > 0 && words[index - 1] !== '/' && LOWERCASE_WORDS.has(word)
        ? word
        : word.replace(/(^|[-'’])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toLocaleUpperCase('fr-FR')),
    )
    .join(' ')
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'station'
}

/**
 * Regroupe les quais en stations physiques UNIQUEMENT via `parent_station`
 * (spec 055 BR-02) ; un quai sans parent reste une station à part entière.
 */
export function buildStations(gtfs: GtfsStatic): PhysicalStop[] {
  const parents = new Map(gtfs.stops.filter(stop => stop.locationType === 1).map(stop => [stop.stopId, stop]))
  const groups = new Map<string, { source: (typeof gtfs.stops)[number]; quays: TransportStop[]; routeIds: Set<string> }>()

  for (const stop of gtfs.stops) {
    if (stop.locationType !== 0) continue
    const parent = stop.parentStation ? parents.get(stop.parentStation) : undefined
    const source = parent ?? stop
    const group = groups.get(source.stopId) ?? { source, quays: [], routeIds: new Set<string>() }
    const stopTimes = gtfs.stopTimesByStop.get(stop.stopId) ?? []
    group.quays.push({
      stopId: stop.stopId,
      name: stop.name,
      latitude: stop.latitude,
      longitude: stop.longitude,
      boarding: stopTimes.some(stopTime => stopTime.boarding),
    })
    for (const stopTime of stopTimes) {
      const routeId = gtfs.trips.get(stopTime.tripId)?.routeId
      if (routeId) group.routeIds.add(routeId)
    }
    groups.set(source.stopId, group)
  }

  const usedIds = new Set<string>()
  return [...groups.values()]
    .map(({ source, quays, routeIds }) => {
      let id = slugify(source.stopId)
      for (let suffix = 2; usedIds.has(id); suffix++) id = `${slugify(source.stopId)}-${suffix}`
      usedIds.add(id)
      return {
        id,
        sourceId: source.stopId,
        name: displayStopName(source.name),
        latitude: source.latitude,
        longitude: source.longitude,
        quays: quays.sort((a, b) => a.stopId.localeCompare(b.stopId)),
        routeIds: [...routeIds].sort(),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}

export type NearbyStation = {
  station: PhysicalStop
  distanceMeters: number
  nearestQuayId: string
}

/** Stations dont un quai de montée est à moins de `maxMeters`, la plus proche d'abord. */
export function findNearbyStations(
  stations: PhysicalStop[],
  latitude: number,
  longitude: number,
  maxMeters: number,
  limit = 3,
): NearbyStation[] {
  return stations
    .flatMap(station => {
      const candidates = station.quays
        .filter(quay => quay.boarding)
        .map(quay => ({ quay, distance: haversineMeters(latitude, longitude, quay.latitude, quay.longitude) }))
        .sort((a, b) => a.distance - b.distance)
      const nearest = candidates[0]
      if (!nearest || nearest.distance > maxMeters) return []
      return [{ station, distanceMeters: Math.round(nearest.distance), nearestQuayId: nearest.quay.stopId }]
    })
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit)
}
