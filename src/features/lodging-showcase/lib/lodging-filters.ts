/**
 * Filtrage client de la vitrine logements (page /logements).
 *
 * Les amenities sont saisies librement par logement (pas de catalogue), on
 * rattache donc chaque filtre (jacuzzi, piscine, hammam) à une liste de
 * mots-clés que l'on compare aux labels normalisés (sans accent ni casse).
 */

export type AmenityFilterId = 'jacuzzi' | 'piscine' | 'hammam'

export type AmenityFilter = {
  id: AmenityFilterId
  label: string
  keywords: string[]
}

export const AMENITY_FILTERS: AmenityFilter[] = [
  { id: 'jacuzzi', label: 'Jacuzzi', keywords: ['jacuzzi', 'spa', 'bain a remous', 'bain nordique'] },
  { id: 'piscine', label: 'Piscine', keywords: ['piscine', 'pool'] },
  { id: 'hammam', label: 'Hammam', keywords: ['hammam', 'sauna'] },
]

export const GUEST_OPTIONS = [2, 4, 6, 8] as const

export type LodgingFilterInput = {
  city_name: string
  max_guests: number
  amenities: string[]
}

export type LodgingFilterState = {
  /** Nom de ville exact, ou null pour toutes les villes. */
  city: string | null
  /** Nombre minimum de couchages, ou null pour indifférent. */
  minGuests: number | null
  /** Amenities requises (toutes doivent être présentes). */
  amenities: AmenityFilterId[]
}

export const EMPTY_FILTER_STATE: LodgingFilterState = {
  city: null,
  minGuests: null,
  amenities: [],
}

/** Minuscule + suppression des accents pour une comparaison tolérante. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function lodgingMatchesAmenity(amenities: string[], id: AmenityFilterId): boolean {
  const filter = AMENITY_FILTERS.find(item => item.id === id)
  if (!filter) return false
  const normalized = amenities.map(normalizeText)
  return normalized.some(label => filter.keywords.some(keyword => label.includes(keyword)))
}

export function filterLodgings<T extends LodgingFilterInput>(
  lodgings: T[],
  state: LodgingFilterState,
): T[] {
  return lodgings.filter(lodging => {
    if (state.city && lodging.city_name !== state.city) return false
    if (state.minGuests != null && lodging.max_guests < state.minGuests) return false
    return state.amenities.every(id => lodgingMatchesAmenity(lodging.amenities, id))
  })
}

/** Villes distinctes présentes dans la sélection, triées alphabétiquement (fr). */
export function deriveCityOptions(lodgings: LodgingFilterInput[]): string[] {
  const cities = new Set<string>()
  for (const lodging of lodgings) {
    if (lodging.city_name) cities.add(lodging.city_name)
  }
  return Array.from(cities).sort((a, b) => a.localeCompare(b, 'fr'))
}

/** N'expose que les filtres d'équipement réellement présents dans la sélection. */
export function deriveAmenityOptions(lodgings: LodgingFilterInput[]): AmenityFilter[] {
  return AMENITY_FILTERS.filter(filter =>
    lodgings.some(lodging => lodgingMatchesAmenity(lodging.amenities, filter.id)),
  )
}

export function isFilterActive(state: LodgingFilterState): boolean {
  return state.city != null || state.minGuests != null || state.amenities.length > 0
}
