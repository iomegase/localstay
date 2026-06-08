/**
 * Position utilisateur partagée entre le popup de géolocalisation et les listes
 * qui affichent des distances. Stockée en `localStorage` pour survivre à la
 * navigation ; un `CustomEvent` synchronise les composants montés sans Context.
 */

export type UserLocation = {
  latitude: number
  longitude: number
}

const LOCATION_KEY = 'staylocal:user-location'
const DISMISSED_KEY = 'staylocal:user-location-dismissed'

/** Émis sur `window` à chaque écriture/effacement de la position. */
export const USER_LOCATION_EVENT = 'staylocal:user-location'

/** Distance à vol d'oiseau (km) entre deux points GPS. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function readStoredLocation(): UserLocation | null {
  if (!isBrowser()) return null
  try {
    const raw = window.localStorage.getItem(LOCATION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as UserLocation).latitude === 'number' &&
      typeof (parsed as UserLocation).longitude === 'number'
    ) {
      const { latitude, longitude } = parsed as UserLocation
      return { latitude, longitude }
    }
    return null
  } catch {
    return null
  }
}

export function storeLocation(location: UserLocation): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(LOCATION_KEY, JSON.stringify(location))
  } catch {
    // localStorage indisponible (mode privé) — la position reste en mémoire via l'event.
  }
  window.dispatchEvent(new CustomEvent(USER_LOCATION_EVENT))
}

export function clearStoredLocation(): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(LOCATION_KEY)
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(USER_LOCATION_EVENT))
}

export function readDismissed(): boolean {
  if (!isBrowser()) return false
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

export function storeDismissed(): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(DISMISSED_KEY, '1')
  } catch {
    // ignore
  }
}
