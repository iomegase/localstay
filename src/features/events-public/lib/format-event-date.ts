const DAY = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', timeZone: 'UTC' })
const DAY_MONTH = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' })
const FULL = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

function sameDay(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate()
}

/** Date FR lisible : un jour → « 13 juin 2026 » ; plage → « du 13 au 15 juin 2026 ». */
export function formatEventDate(start: Date, end: Date): string {
  if (sameDay(start, end)) return FULL.format(start)
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear()
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth()
  if (sameMonth) return `du ${DAY.format(start)} au ${FULL.format(end)}`
  if (sameYear) return `du ${DAY_MONTH.format(start)} au ${FULL.format(end)}`
  return `du ${FULL.format(start)} au ${FULL.format(end)}`
}
