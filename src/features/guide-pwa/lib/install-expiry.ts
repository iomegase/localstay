/**
 * Spec 059 US-03 : le guide installé se désactive 7 jours après sa première
 * ouverture en mode installé. Règle produit côté appareil (BR-04), rien n'est
 * envoyé au serveur (BR-05).
 */
export const PWA_VALIDITY_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

export type InstallRecord = { startedAt: string }

function storageKey(lodgingId: string): string {
  return `mystay:pwa:${lodgingId}`
}

export function readInstallRecord(lodgingId: string): InstallRecord | null {
  try {
    const raw = window.localStorage.getItem(storageKey(lodgingId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' && parsed !== null && 'startedAt' in parsed &&
      typeof parsed.startedAt === 'string' && !Number.isNaN(Date.parse(parsed.startedAt))
    ) {
      return { startedAt: parsed.startedAt }
    }
    return null
  } catch {
    return null
  }
}

export function ensureInstallRecord(lodgingId: string, now: Date = new Date()): InstallRecord {
  const existing = readInstallRecord(lodgingId)
  if (existing) return existing
  const record = { startedAt: now.toISOString() }
  try {
    window.localStorage.setItem(storageKey(lodgingId), JSON.stringify(record))
  } catch {
    // Stockage bloqué : la période démarre à chaque ouverture, le guide reste lisible.
  }
  return record
}

export function clearInstallRecord(lodgingId: string): void {
  try {
    window.localStorage.removeItem(storageKey(lodgingId))
  } catch {
    // Rien à effacer si le stockage est indisponible.
  }
}

export function installEndsAt(record: InstallRecord): Date {
  return new Date(Date.parse(record.startedAt) + PWA_VALIDITY_DAYS * DAY_MS)
}

export function isInstallExpired(record: InstallRecord, now: Date = new Date()): boolean {
  return now.getTime() >= installEndsAt(record).getTime()
}
