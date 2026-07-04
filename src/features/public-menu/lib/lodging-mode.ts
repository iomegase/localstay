import { cookies } from 'next/headers'
import { prisma } from '@/shared/lib/prisma'

export const LODGING_COOKIE_NAME = 'lodging_id'

export type LodgingModeContext = {
  lodgingId: string
  lodgingName: string
  citySlug: string
  cityName: string
  ownerName: string | null
}

export async function getActiveLodgingContext(): Promise<LodgingModeContext | null> {
  const store = await cookies()
  const lodgingId = store.get(LODGING_COOKIE_NAME)?.value
  if (!lodgingId || !/^[0-9a-fA-F-]{36}$/.test(lodgingId)) return null

  let lodging
  try {
    lodging = await prisma.lodging.findFirst({
      where: { id: lodgingId, deleted_at: null, is_active: true },
      select: {
        id: true,
        name: true,
        city: { select: { slug: true, name: true } },
        owner: { select: { first_name: true } },
      },
    })
  } catch (error) {
    // The DB can be transiently unreachable (e.g. Supabase pooler waking from
    // idle). This runs in the root public layout, so degrade gracefully to the
    // "no lodging context" state rather than crashing every public page.
    console.error('[lodging-mode] failed to resolve active lodging context', error)
    return null
  }
  if (!lodging) return null

  const ownerName = lodging.owner.first_name?.trim() ?? ''

  return {
    lodgingId: lodging.id,
    lodgingName: lodging.name,
    citySlug: lodging.city.slug,
    cityName: lodging.city.name,
    ownerName: ownerName === '' ? null : ownerName,
  }
}
