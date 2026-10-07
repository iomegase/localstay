// Spec 089 : nuits indisponibles d'après un calendrier iCal (Airbnb, Booking…).

/** Plage de nuits indisponibles : `start` incluse, `end` exclue (dates AAAA-MM-JJ). */
export type BusyRange = { start: string; end: string }

export const AVAILABILITY_HORIZON_MONTHS = 12

function toIsoDate(value: string): string | null {
  const match = value.trim().match(/^(\d{4})(\d{2})(\d{2})/)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Premier jour du mois de `isoDate` décalé de `months` mois. */
export function addMonths(isoDate: string, months: number): string {
  const [year, month] = isoDate.split('-').map(Number) as [number, number]
  const date = new Date(Date.UTC(year, month - 1 + months, 1))
  return date.toISOString().slice(0, 10)
}

/** BR-02 : du 1er du mois courant à 12 mois plus tard (exclu). */
export function availabilityHorizon(today: string): BusyRange {
  return { start: addMonths(today, 0), end: addMonths(today, AVAILABILITY_HORIZON_MONTHS) }
}

/** AC-02-02 : DTSTART inclus, DTEND exclu ; seules les dates sont conservées (BR-05). */
export function parseIcalBusyRanges(ics: string, horizon: BusyRange): BusyRange[] {
  // RFC 5545 : une ligne qui commence par une espace prolonge la précédente.
  const lines = ics.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '').split('\n')
  const ranges: BusyRange[] = []
  let current: { start?: string; end?: string } | null = null

  for (const line of lines) {
    const upper = line.toUpperCase()
    if (upper.startsWith('BEGIN:VEVENT')) current = {}
    else if (upper.startsWith('END:VEVENT')) {
      if (current?.start) {
        const end = current.end && current.end > current.start ? current.end : addDays(current.start, 1)
        const start = current.start < horizon.start ? horizon.start : current.start
        const clippedEnd = end > horizon.end ? horizon.end : end
        if (start < clippedEnd) ranges.push({ start, end: clippedEnd })
      }
      current = null
    } else if (current) {
      const separator = line.indexOf(':')
      if (separator < 0) continue
      const name = upper.slice(0, separator).split(';')[0]
      if (name === 'DTSTART') current.start = toIsoDate(line.slice(separator + 1)) ?? undefined
      if (name === 'DTEND') current.end = toIsoDate(line.slice(separator + 1)) ?? undefined
    }
  }

  return mergeRanges(ranges)
}

function mergeRanges(ranges: BusyRange[]): BusyRange[] {
  const sorted = [...ranges].sort((a, b) => a.start.localeCompare(b.start))
  const merged: BusyRange[] = []
  for (const range of sorted) {
    const last = merged[merged.length - 1]
    if (last && range.start <= last.end) {
      if (range.end > last.end) last.end = range.end
    } else merged.push({ ...range })
  }
  return merged
}

export function isBusyNight(isoDate: string, ranges: BusyRange[]): boolean {
  return ranges.some(range => isoDate >= range.start && isoDate < range.end)
}

/** Date du jour à Paris (AAAA-MM-JJ). */
export function parisToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(now)
}

export type CalendarDay = { date: string; day: number } | null

/** Semaines d'un mois, du lundi au dimanche (cases vides avant le 1er / après le dernier jour). */
export function monthGrid(firstOfMonth: string): CalendarDay[][] {
  const [year, month] = firstOfMonth.split('-').map(Number) as [number, number]
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const leading = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7
  const cells: CalendarDay[] = Array.from({ length: leading }, () => null)
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: `${firstOfMonth.slice(0, 8)}${String(day).padStart(2, '0')}`, day })
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7))
}
