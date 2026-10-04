type SearchablePoi = {
  name: string
  category: { name: string }
  description?: string
  shortDescription?: string
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('fr-FR').trim()
}

/** Recherche locale sur le nom, la catégorie et la description (spec 056 AC-01-02). */
export function filterPoisByQuery<P extends SearchablePoi>(pois: readonly P[], query: string): P[] {
  const needle = normalize(query)
  if (!needle) return [...pois]
  return pois.filter(poi =>
    [poi.name, poi.category.name, poi.description ?? '', poi.shortDescription ?? '']
      .some(text => normalize(text).includes(needle)),
  )
}

/** Distance à vol d'oiseau lisible : « 350 m », « 1,2 km », « 15 km » (spec 056 AC-01-04). */
export function formatDistanceMeters(meters: number, locale: 'fr' | 'en' = 'fr'): string {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`
  const kilometers = meters / 1000
  return kilometers < 10
    ? `${kilometers.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-GB', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} km`
    : `${Math.round(kilometers)} km`
}

/** « Saint-Gervais-les-Bains » → « Saint-Gervais » (titre de l'onglet Guide). */
export function guideCityTitle(city: string): string {
  return city.replace(/-les-bains$/i, '')
}

/** Au-delà de 25 min à pied, la grille affiche le temps en voiture (spec 057 AC-01-01). */
export const WALKING_MAX_SECONDS = 25 * 60

export type TravelTimeValues = { walkingSeconds: number | null; drivingSeconds: number | null }
export type TravelMode = 'walking' | 'driving'

/** « 6 min », « 1 h 05 », « 2 h ». */
export function formatTravelDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, '0')}`
}

/** Le temps réel le plus pertinent pour une carte : à pied si court, sinon en voiture. */
export function primaryTravel(travel: TravelTimeValues | undefined): { mode: TravelMode; label: string } | null {
  if (!travel) return null
  if (travel.walkingSeconds !== null && travel.walkingSeconds <= WALKING_MAX_SECONDS) {
    return { mode: 'walking', label: formatTravelDuration(travel.walkingSeconds) }
  }
  if (travel.drivingSeconds !== null) return { mode: 'driving', label: formatTravelDuration(travel.drivingSeconds) }
  if (travel.walkingSeconds !== null) return { mode: 'walking', label: formatTravelDuration(travel.walkingSeconds) }
  return null
}

/** Catégories exclues du carrousel de la page Séjour (décision PO du 2026-10-02). */
export const STAY_HOME_EXCLUDED_CATEGORIES = new Set(['urgences', 'urgence', 'mobilite'])
