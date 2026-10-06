import { prisma } from '@/shared/lib/prisma'
import { maintenanceMessage, type MaintenanceState } from '../lib/maintenance'

// Spec 087 AC-01-02 : état lu au plus une fois toutes les 15 s par instance.
const CACHE_TTL_MS = 15_000
let cache: { state: MaintenanceState; expiresAt: number } | null = null

async function readMaintenanceRow() {
  return prisma.siteMaintenance.findFirst({
    where: { deleted_at: null },
    orderBy: { created_at: 'asc' },
    select: { id: true, enabled: true, message: true },
  })
}

export async function getMaintenanceState(): Promise<MaintenanceState> {
  const row = await readMaintenanceRow()
  return { enabled: row?.enabled ?? false, message: maintenanceMessage(row?.message) }
}

/** Lecture mise en cache pour le proxy ; en cas d'erreur, le site reste ouvert (BR-02). */
export async function isMaintenanceEnabled(now = Date.now()): Promise<boolean> {
  if (cache && cache.expiresAt > now) return cache.state.enabled
  try {
    const state = await getMaintenanceState()
    cache = { state, expiresAt: now + CACHE_TTL_MS }
    return state.enabled
  } catch (error) {
    console.error('[maintenance] lecture impossible', error)
    return false
  }
}

export async function setMaintenanceState(input: { enabled: boolean; message: string | null }, adminId: string): Promise<MaintenanceState> {
  const existing = await readMaintenanceRow()
  const data = { enabled: input.enabled, message: input.message?.trim() || null, updated_by: adminId }
  const row = existing
    ? await prisma.siteMaintenance.update({ where: { id: existing.id }, data, select: { enabled: true, message: true } })
    : await prisma.siteMaintenance.create({ data, select: { enabled: true, message: true } })
  const state = { enabled: row.enabled, message: maintenanceMessage(row.message) }
  cache = { state, expiresAt: Date.now() + CACHE_TTL_MS }
  return state
}

/** Tests uniquement. */
export function resetMaintenanceCache() {
  cache = null
}
