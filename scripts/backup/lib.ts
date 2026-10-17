// Spec 081 : logique pure de la sauvegarde locale (testée).

const DUMP_PATTERN = /^mystay-(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})\.dump$/
const DAY_MS = 24 * 60 * 60 * 1000

const pad = (value: number) => String(value).padStart(2, '0')

/** Spec 081 AC-01-01 : mystay-AAAA-MM-JJ-HHMM.dump (heure locale). */
export function dumpFileName(date: Date): string {
  return `mystay-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}.dump`
}

export function dumpDate(fileName: string): Date | null {
  const match = fileName.match(DUMP_PATTERN)
  if (!match) return null
  const [, year, month, day, hours, minutes] = match.map(Number)
  return new Date(year!, month! - 1, day!, hours!, minutes!)
}

// Âge en jours calendaires (insensible aux changements d'heure).
function calendarDaysBetween(from: Date, to: Date): number {
  return Math.round((Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) - Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) / DAY_MS)
}

/** Spec 081 AC-01-03 : dumps à supprimer (plus vieux que `days`), jamais le plus récent. */
export function expiredDumps(fileNames: string[], now: Date, days: number): string[] {
  const dumps = fileNames
    .map(name => ({ name, date: dumpDate(name) }))
    .filter((dump): dump is { name: string; date: Date } => dump.date !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
  const newest = dumps.at(-1)?.name
  return dumps
    .filter(dump => dump.name !== newest && calendarDaysBetween(dump.date, now) > days)
    .map(dump => dump.name)
}

export type RemoteStorageFile = { bucket: string; path: string; size: number; updated_at: string }
export type StorageManifest = Record<string, { size: number; updated_at: string }>

export function storageKey(file: { bucket: string; path: string }): string {
  return `${file.bucket}/${file.path}`
}

/** Spec 081 AC-01-02 : fichiers nouveaux ou modifiés (taille ou date) depuis la dernière copie. */
export function planStorageDownloads(remote: RemoteStorageFile[], manifest: StorageManifest): RemoteStorageFile[] {
  return remote.filter(file => {
    const known = manifest[storageKey(file)]
    return !known || known.size !== file.size || known.updated_at !== file.updated_at
  })
}

/**
 * Spec 081 BR-06 : attend que le réseau réponde (le Mac en veille lance la tâche pendant un
 * réveil de maintenance, sans réseau). `true` dès que `check` réussit, `false` après `maxWaitMs`.
 */
/**
 * Spec 081 BR-06 (révision 2026-10-18) : l'attente se compte en vérifications (maxWaitMs / intervalMs),
 * pas en temps d'horloge. Le Mac en veille sur batterie ne consomme plus le délai : au réveil de
 * maintenance (sans réseau), la sauvegarde n'échoue plus d'emblée parce que 60 min ont « passé ».
 */
export async function waitForNetwork(
  check: () => Promise<boolean>,
  options: { intervalMs: number; maxWaitMs: number; sleep?: (ms: number) => Promise<void>; onWait?: () => void },
): Promise<boolean> {
  const sleep = options.sleep ?? (ms => new Promise<void>(resolve => setTimeout(resolve, ms)))
  const maxAttempts = Math.floor(options.maxWaitMs / options.intervalMs) + 1
  let notified = false
  for (let attempt = 1; ; attempt++) {
    if (await check().catch(() => false)) return true
    if (attempt >= maxAttempts) return false
    if (!notified) {
      options.onWait?.()
      notified = true
    }
    await sleep(options.intervalMs)
  }
}

/** Spec 081 BR-07 : créneau de sauvegarde (heures locales, fin exclue) — Mac en veille la nuit. */
export const BACKUP_WINDOW = { startHour: 9, endHour: 23 } as const

/** Sauvegarde à chaque passage horaire du créneau ; ignorée en dehors (rattrapage launchd au réveil). */
export function isInBackupWindow(now: Date, window = BACKUP_WINDOW): boolean {
  const hour = now.getHours()
  return hour >= window.startHour && hour < window.endHour
}
