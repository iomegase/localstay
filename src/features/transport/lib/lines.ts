import type { GtfsStatic } from './gtfs-static'
import type { PublicLine } from '../types'

/** Tracés des lignes (GTFS `shapes`), un jeu de chemins par ligne (spec 058 AC-01-01). */
export function buildLines(gtfs: GtfsStatic): PublicLine[] {
  return [...gtfs.routes]
    .sort((a, b) => a.shortName.localeCompare(b.shortName, 'fr', { numeric: true }))
    .map(route => {
      const shapeIds = new Set(
        [...gtfs.trips.values()]
          .filter(trip => trip.routeId === route.id && trip.shapeId)
          .map(trip => trip.shapeId as string),
      )
      return {
        routeId: route.id,
        shortName: route.shortName,
        longName: route.longName,
        color: route.color,
        textColor: route.textColor,
        paths: [...shapeIds]
          .map(id => gtfs.shapes.get(id) ?? [])
          .filter(path => path.length > 1),
      }
    })
}
