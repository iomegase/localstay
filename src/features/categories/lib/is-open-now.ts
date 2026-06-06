import type { PoiHours } from '../types'

const PARIS_TZ = 'Europe/Paris'

export function computeIsOpenNow(hours: PoiHours | null | undefined, now: Date = new Date()): boolean | null {
  if (!hours) return null

  const paris = parisWallClock(now)
  const todayMinutes = paris.hour * 60 + paris.minute
  const yesterdayIndex = (paris.dayIndex + 6) % 7

  const today = readSlot(hours, paris.dayIndex)
  if (today && withinWindow(todayMinutes, today.openMin, today.closeMin)) return true

  const yesterday = readSlot(hours, yesterdayIndex)
  if (yesterday && yesterday.closeMin < yesterday.openMin && todayMinutes < yesterday.closeMin) {
    return true
  }

  return false
}

export function getTodayCloseLabel(
  hours: PoiHours | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!hours) return null
  const paris = parisWallClock(now)
  const today = readSlot(hours, paris.dayIndex)
  if (!today) return null
  const h = Math.floor(today.closeMin / 60) % 24
  const m = today.closeMin % 60
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

// Index = dayIndex (0 = dimanche … 6 = samedi), aligné sur getUTCDay/parisWallClock.
const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'] as const

function formatHHMM(min: number): string {
  const h = Math.floor(min / 60) % 24
  const m = min % 60
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

/**
 * Prochaine ouverture (jour + heure) sous forme "aujourd'hui/demain/<jour> à <h>h".
 * Utilisé quand le POI est fermé. Parcourt jusqu'à 8 jours pour trouver le prochain créneau,
 * en ignorant le créneau d'aujourd'hui s'il est déjà passé/ouvert. null si aucune horaire.
 */
export function getNextOpenLabel(
  hours: PoiHours | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!hours) return null
  const paris = parisWallClock(now)
  const nowMinutes = paris.hour * 60 + paris.minute

  for (let offset = 0; offset < 8; offset += 1) {
    const dayIndex = (paris.dayIndex + offset) % 7
    const slot = readSlot(hours, dayIndex)
    if (!slot) continue
    if (offset === 0 && nowMinutes >= slot.openMin) continue

    const dayLabel = offset === 0 ? "aujourd'hui" : offset === 1 ? 'demain' : DAY_NAMES[dayIndex]
    return `${dayLabel} à ${formatHHMM(slot.openMin)}`
  }
  return null
}

type Slot = { openMin: number; closeMin: number }

function readSlot(hours: PoiHours, dayIndex: number): Slot | null {
  const key = String(dayIndex) as keyof PoiHours
  const value = hours[key]
  if (!value) return null
  const openMin = parseHHMM(value.open)
  const closeMin = parseHHMM(value.close)
  if (openMin === null || closeMin === null) return null
  return { openMin, closeMin }
}

function withinWindow(t: number, openMin: number, closeMin: number): boolean {
  if (closeMin > openMin) return t >= openMin && t < closeMin
  if (closeMin < openMin) return t >= openMin || t < closeMin
  return false
}

function parseHHMM(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  if (h < 0 || h > 24 || m < 0 || m > 59) return null
  return h * 60 + m
}

function parisWallClock(now: Date): { dayIndex: number; hour: number; minute: number } {
  const iso = now.toLocaleString('sv-SE', { timeZone: PARIS_TZ })
  const match = /^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2})/.exec(iso)
  if (!match) {
    return { dayIndex: now.getDay(), hour: now.getHours(), minute: now.getMinutes() }
  }
  const [, y, mo, d, h, mi] = match
  const dayIndex = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d))).getUTCDay()
  return { dayIndex, hour: Number(h), minute: Number(mi) }
}
