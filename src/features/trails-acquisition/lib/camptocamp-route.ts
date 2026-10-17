import { mercatorXToLng, mercatorYToLat } from './projection'

// Spec 102 AC-01-01 : faits d'un itinéraire Camptocamp utiles à la complétion.
export type Coord = [number, number]
export type CamptocampRouteFacts = {
  title: string | null
  access: Coord | null
  destination: { name: string; coord: Coord } | null
  lengthKm: number | null
  heightDiffUp: number | null
}

type Locale = { lang?: string; title?: string; title_prefix?: string }
type Waypoint = { waypoint_type?: string; locales?: Locale[]; geometry?: { geom?: string | null } | null }
type RouteDocument = {
  locales?: Locale[]
  route_length?: number | null
  height_diff_up?: number | null
  associations?: { waypoints?: Waypoint[] }
}

function frenchLocale(locales: Locale[] | undefined): Locale | undefined {
  return locales?.find(locale => locale.lang === 'fr') ?? locales?.[0]
}

/** Point Camptocamp (EPSG:3857, JSON en texte) → [lng, lat]. */
export function camptocampPoint(geom: string | null | undefined): Coord | null {
  if (!geom) return null
  try {
    const parsed = JSON.parse(geom) as { type?: string; coordinates?: unknown }
    if (parsed.type !== 'Point' || !Array.isArray(parsed.coordinates)) return null
    const [x, y] = parsed.coordinates as number[]
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null
    return [Number(mercatorXToLng(x).toFixed(6)), Number(mercatorYToLat(y).toFixed(6))]
  } catch {
    return null
  }
}

export function camptocampRouteFacts(document: RouteDocument): CamptocampRouteFacts {
  const locale = frenchLocale(document.locales)
  const prefix = locale?.title_prefix?.trim()
  const title = locale?.title?.trim()
  const waypoints = document.associations?.waypoints ?? []
  const access = waypoints.find(waypoint => waypoint.waypoint_type === 'access')
  const target = waypoints.find(waypoint => waypoint.waypoint_type !== 'access' && camptocampPoint(waypoint.geometry?.geom))
  const targetName = frenchLocale(target?.locales)?.title?.trim()
  const targetCoord = camptocampPoint(target?.geometry?.geom)
  return {
    title: prefix && title ? `${prefix} : ${title}` : title ?? null,
    access: camptocampPoint(access?.geometry?.geom),
    destination: targetName && targetCoord ? { name: targetName, coord: targetCoord } : null,
    lengthKm: typeof document.route_length === 'number' && document.route_length > 0 ? Math.round(document.route_length / 100) / 10 : null,
    heightDiffUp: typeof document.height_diff_up === 'number' && document.height_diff_up > 0 ? document.height_diff_up : null,
  }
}

/** « Depuis Bionnassay » → « Refuge de Tête Rousse : Depuis Bionnassay » ; jamais de double préfixe. */
export function completedTitle(current: string, facts: CamptocampRouteFacts): string {
  if (!facts.title || facts.title === current) return current
  return facts.title.endsWith(current) && facts.title.length > current.length ? facts.title : current
}
