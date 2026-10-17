import { camptocampRouteFacts, completedTitle, type Coord } from '../lib/camptocamp-route'
import type { TrailPhoto } from '../lib/photos'
import { findIgnPlace } from './ign-places'
import { fetchOrsHikingRoute, enrichCandidatesWithDuration, naismithDurationMin } from './ors'
import { computeDrivingAccess } from '@/features/transport/travel-times'
import { enrichCandidatesWithIgn } from './ign'
import { enrichCandidatesWithTrailPhotos, findCamptocampPhotos } from './camptocamp-photos'
import { createGeotrekPhotoFinder } from './geotrek-photos'
import { createTourismSitePhotoFinder } from './tourism-site-photos'
import { findCommonsPhotos } from '@/features/poi-photos/services/wikimedia-commons'

/** Spec 102 AC-01-07 : départ à plus de 45 min en voiture du centre de la ville → signalé hors zone. */
const OUT_OF_ZONE_DRIVING_SECONDS = 45 * 60
const LOOP_TITLE = /\b(tour|boucle|circuit)\b/i

type SourceRef = { type: string; used_for: string[]; attribution: string; url?: string; name?: string }

export type CompletableTrail = {
  id: string
  title: string
  primary_source_type: string
  source_refs: unknown
  raw_payload: unknown
  distance_km: number | null
  elevation_gain_m: number | null
  estimated_duration_min: number | null
  loop_type: string | null
  start_latitude: number | null
  start_longitude: number | null
  geometry_geojson: unknown
  geometry_status: string
  elevation_status: string
  metric_source: string | null
}

export type CompletionCity = { name: string; latitude: number; longitude: number; tourism_site_url?: string | null }
export type TrailCompletion = {
  id: string
  title: string
  changes: string[]
  /** Minutes de voiture du centre de la ville au départ (Mapbox), null si inconnu. */
  drivingMinutes: number | null
  outOfZone: boolean
  candidate: CompletableTrail
}

function distanceKm(a: Coord, b: Coord): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

function sourceRefs(candidate: CompletableTrail): SourceRef[] {
  return Array.isArray(candidate.source_refs) ? candidate.source_refs as SourceRef[] : []
}

function addSourceRef(candidate: CompletableTrail, ref: SourceRef) {
  candidate.source_refs = [...sourceRefs(candidate), ref]
}

function camptocampRouteId(candidate: CompletableTrail): number | null {
  for (const ref of sourceRefs(candidate)) {
    const match = typeof ref.url === 'string' ? /camptocamp\.org\/routes\/(\d+)/.exec(ref.url) : null
    if (match) return Number(match[1])
  }
  return null
}

async function fetchCamptocampRoute(id: number): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(`https://api.camptocamp.org/routes/${id}?l=fr`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15_000) })
    return response.ok ? await response.json() as Record<string, unknown> : null
  } catch {
    return null
  }
}

/** Tout tracé déjà présent (LineString, MultiLineString, Feature…) compte : il n'est jamais recalculé. */
function hasGeometry(candidate: CompletableTrail): boolean {
  if (candidate.geometry_status !== 'missing') return true
  const points = JSON.stringify(candidate.geometry_geojson ?? null).match(/\[-?\d+(\.\d+)?,-?\d+(\.\d+)?/g)
  return (points?.length ?? 0) >= 2
}

/** Spec 102 AC-01-05 : dernier recours photo — Wikimedia Commons (licences libres, crédits). */
type PhotoSubject = { title: string; start_latitude?: number | null; start_longitude?: number | null }

function commonsFinder(city: CompletionCity, placeNames: Map<string, string>) {
  return async (candidate: PhotoSubject): Promise<TrailPhoto[]> => {
    const near = { latitude: candidate.start_latitude ?? city.latitude, longitude: candidate.start_longitude ?? city.longitude }
    const names = [placeNames.get(candidate.title), candidate.title].filter((name, index, all): name is string => Boolean(name) && all.indexOf(name) === index)
    for (const name of names) {
      const photos = await findCommonsPhotos({ name, ...near, city: city.name })
      if (photos.length) {
        return photos.map(photo => ({
          url: photo.photo_url,
          source_url: photo.source_url,
          attribution: `${photo.author} — Wikimedia Commons`,
          license: photo.license,
        }))
      }
    }
    return []
  }
}

/**
 * Spec 102 US-01 : complète les randonnées à revoir (titre, départ, destination, tracé calculé,
 * distance, dénivelé, durée, photos) sans jamais écraser une valeur présente (AC-01-06).
 * Travaille sur des copies ; l'appelant enregistre les changements.
 */
export async function completeTrailCandidates(rows: CompletableTrail[], city: CompletionCity): Promise<TrailCompletion[]> {
  const candidates = rows.map(row => structuredClone(row))
  const before = new Map(candidates.map(candidate => [candidate.id, JSON.stringify(candidate)]))
  const changes = new Map<string, string[]>(candidates.map(candidate => [candidate.id, []]))
  // Nom de la destination par titre (après complétion du titre) : recherche de photos Commons.
  const placeNames = new Map<string, string>()
  const note = (candidate: CompletableTrail, change: string) => changes.get(candidate.id)!.push(change)
  const cityCenter: Coord = [city.longitude, city.latitude]
  const computedTraces = new Set<string>()

  for (const candidate of candidates) {
    let destination: { name: string; coord: Coord } | null = null

    // AC-01-01 : fiche Camptocamp relue.
    const routeId = candidate.primary_source_type === 'camptocamp' ? camptocampRouteId(candidate) : null
    const route = routeId ? await fetchCamptocampRoute(routeId) : null
    if (route) {
      const facts = camptocampRouteFacts(route)
      const title = completedTitle(candidate.title, facts)
      if (title !== candidate.title) { note(candidate, `titre « ${title} »`); candidate.title = title }
      if (candidate.start_latitude == null && facts.access) {
        candidate.start_longitude = facts.access[0]
        candidate.start_latitude = facts.access[1]
        addSourceRef(candidate, { type: 'camptocamp', used_for: ['start_latitude', 'start_longitude'], attribution: 'Camptocamp.org (CC-BY-SA)', url: `https://www.camptocamp.org/routes/${routeId}` })
        note(candidate, 'départ (Camptocamp)')
      }
      if (candidate.distance_km == null && facts.lengthKm) { candidate.distance_km = facts.lengthKm; note(candidate, `distance ${facts.lengthKm} km (Camptocamp)`) }
      if (candidate.elevation_gain_m == null && facts.heightDiffUp) {
        candidate.elevation_gain_m = facts.heightDiffUp
        candidate.elevation_status = 'valid'
        candidate.metric_source = candidate.metric_source ?? 'camptocamp'
        note(candidate, `D+ ${facts.heightDiffUp} m (Camptocamp)`)
      }
      destination = facts.destination
    }

    // AC-01-02 : destination IGN pour les randonnées sans fiche Camptocamp.
    const start: Coord | null = candidate.start_latitude != null && candidate.start_longitude != null
      ? [candidate.start_longitude, candidate.start_latitude] : null
    if (!destination) destination = await findIgnPlace(candidate.title, start ?? cityCenter)
    if (destination) placeNames.set(candidate.title, destination.name)

    // AC-01-03 / AC-01-04 : tracé calculé et distance aller-retour.
    const isLoop = candidate.loop_type === 'loop' || LOOP_TITLE.test(candidate.title)
    if (!hasGeometry(candidate) && start && destination && isLoop) {
      note(candidate, 'boucle : tracé non calculé (un aller-retour ne la représente pas)')
    } else if (!hasGeometry(candidate) && start && destination && distanceKm(start, destination.coord) > 0.2) {
      try {
        const traced = await fetchOrsHikingRoute(start, destination.coord)
        // Un aller plus long que l'itinéraire entier annoncé par la source : mauvais départ ou destination.
        if (traced && candidate.distance_km != null && traced.distanceKm > candidate.distance_km) {
          note(candidate, `tracé calculé écarté (${traced.distanceKm} km aller pour ${candidate.distance_km} km annoncés)`)
        } else if (traced) {
          computedTraces.add(candidate.id)
          candidate.geometry_geojson = { type: 'LineString', coordinates: traced.coordinates }
          candidate.geometry_status = 'needs_review'
          addSourceRef(candidate, { type: 'ors_route', used_for: ['geometry'], attribution: 'openrouteservice.org — © contributeurs OpenStreetMap' })
          note(candidate, `tracé calculé vers « ${destination.name} » (${traced.distanceKm} km aller)`)
          if (candidate.distance_km == null) {
            candidate.distance_km = Math.round(traced.distanceKm * 20) / 10
            candidate.loop_type = candidate.loop_type ?? 'out_and_back'
            note(candidate, `distance ${candidate.distance_km} km aller-retour`)
          }
        }
      } catch (error) {
        console.warn(`[trail-completion] ORS indisponible pour « ${candidate.title} » :`, error instanceof Error ? error.message : error)
      }
    }
  }

  // AC-01-04 : dénivelé IGN (seulement s'il manque), durée ORS / Naismith.
  const elevationMissing = candidates.filter(candidate => candidate.elevation_gain_m == null)
  await enrichCandidatesWithIgn(elevationMissing)
  for (const candidate of elevationMissing) if (candidate.elevation_gain_m != null) note(candidate, `D+ ${candidate.elevation_gain_m} m (IGN)`)
  // Tracé calculé = aller seul : la durée vient de Naismith sur la distance aller-retour et le D+.
  for (const candidate of candidates) {
    if (!computedTraces.has(candidate.id) || candidate.estimated_duration_min != null) continue
    const minutes = naismithDurationMin(candidate.distance_km, candidate.elevation_gain_m)
    if (minutes != null) { candidate.estimated_duration_min = minutes; note(candidate, `durée ${minutes} min (Naismith, aller-retour)`) }
  }
  const durationMissing = candidates.filter(candidate => candidate.estimated_duration_min == null)
  await enrichCandidatesWithDuration(durationMissing)
  for (const candidate of durationMissing) if (candidate.estimated_duration_min != null) note(candidate, `durée ${candidate.estimated_duration_min} min`)

  // AC-01-05 : photos — sources existantes puis Wikimedia Commons.
  const photoCity = { latitude: city.latitude, longitude: city.longitude, tourism_site_url: city.tourism_site_url }
  const hadPhotos = new Set(candidates.filter(candidate => (candidate.raw_payload as { acquired_photos?: unknown[] } | null)?.acquired_photos?.length).map(candidate => candidate.id))
  await enrichCandidatesWithTrailPhotos(candidates, photoCity, undefined, [
    createGeotrekPhotoFinder(photoCity),
    ...(city.tourism_site_url ? [createTourismSitePhotoFinder(city.tourism_site_url)] : []),
    (candidate, signal) => findCamptocampPhotos(candidate, photoCity, undefined, signal),
    commonsFinder(city, placeNames),
  ])
  for (const candidate of candidates) {
    const photos = (candidate.raw_payload as { acquired_photos?: TrailPhoto[] } | null)?.acquired_photos ?? []
    if (!hadPhotos.has(candidate.id) && photos.length) note(candidate, `${photos.length} photo(s) — ${[...new Set(photos.map(photo => photo.attribution))].join(' · ')}`)
  }

  // AC-01-07 : temps de route jusqu'au départ (rapport seulement, rien n'est modifié).
  const located = candidates.filter(candidate => candidate.start_latitude != null && candidate.start_longitude != null)
  let driving: Record<string, { seconds: number | null }> = {}
  try {
    driving = located.length
      ? await computeDrivingAccess(city, located.map(candidate => ({ id: candidate.id, latitude: candidate.start_latitude!, longitude: candidate.start_longitude! })))
      : {}
  } catch (error) {
    console.warn('[trail-completion] temps de route Mapbox indisponible :', error instanceof Error ? error.message : error)
  }

  return candidates.map(candidate => {
    const seconds = driving[candidate.id]?.seconds ?? null
    return {
      id: candidate.id,
      title: candidate.title,
      changes: JSON.stringify(candidate) === before.get(candidate.id) ? [] : changes.get(candidate.id)!,
      drivingMinutes: seconds == null ? null : Math.round(seconds / 60),
      outOfZone: seconds != null && seconds > OUT_OF_ZONE_DRIVING_SECONDS,
      candidate,
    }
  })
}
