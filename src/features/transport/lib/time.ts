export const TRANSPORT_TIMEZONE = 'Europe/Paris'

const offsetFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TRANSPORT_TIMEZONE,
  timeZoneName: 'longOffset',
})
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TRANSPORT_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
  timeZone: TRANSPORT_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
})

/** Décalage Europe/Paris (minutes) à un instant donné. */
function parisOffsetMinutes(instant: Date): number {
  const label = offsetFormatter.formatToParts(instant).find(part => part.type === 'timeZoneName')?.value ?? 'GMT'
  const match = label.match(/GMT([+-])(\d{2}):(\d{2})/)
  if (!match) return 0
  const minutes = Number(match[2]) * 60 + Number(match[3])
  return match[1] === '-' ? -minutes : minutes
}

/**
 * Origine GTFS d'une date de service « YYYYMMDD » : midi local moins 12 h
 * (gère les journées de 23 h / 25 h des changements d'heure).
 */
export function serviceDayStart(serviceDate: string): Date {
  const year = Number(serviceDate.slice(0, 4))
  const month = Number(serviceDate.slice(4, 6))
  const day = Number(serviceDate.slice(6, 8))
  const noonUtcGuess = new Date(Date.UTC(year, month - 1, day, 12))
  const noon = noonUtcGuess.getTime() - parisOffsetMinutes(noonUtcGuess) * 60_000
  return new Date(noon - 12 * 3_600_000)
}

/** Date de service Europe/Paris (« YYYYMMDD ») d'un instant, décalée de `offsetDays`. */
export function parisServiceDate(instant: Date, offsetDays = 0): string {
  const [year, month, day] = dateFormatter.format(instant).split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1, day + offsetDays))
  return shifted.toISOString().slice(0, 10).replaceAll('-', '')
}

/** « HH:MM » en Europe/Paris, indépendamment du fuseau du serveur ou du navigateur. */
export function formatParisTime(iso: string): string {
  return timeFormatter.format(new Date(iso))
}

/** Timestamp Unix (s ou ms, nombre ou chaîne) → secondes, ou null s'il est invalide. */
export function toEpochSeconds(value: unknown): number | null {
  const numeric = typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value) : value
  if (typeof numeric !== 'number' || !Number.isFinite(numeric) || numeric <= 0) return null
  const seconds = numeric > 1e12 ? Math.floor(numeric / 1000) : Math.floor(numeric)
  // Bornes de plausibilité : 2001-09 → 2286-11.
  return seconds > 1e9 && seconds < 1e10 ? seconds : null
}

/** « HH:MM:SS » GTFS (heures ≥ 24 autorisées) → secondes depuis l'origine du jour de service. */
export function parseGtfsTime(value: string): number | null {
  const match = value.match(/^(\d{1,2}):(\d{2}):(\d{2})$/)
  if (!match) return null
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])
}
