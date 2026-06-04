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

  const lodging = await prisma.lodging.findFirst({
    where: { id: lodgingId, deleted_at: null, is_active: true },
    select: {
      id: true,
      name: true,
      city: { select: { slug: true, name: true } },
      owner: { select: { first_name: true, last_name: true } },
    },
  })
  if (!lodging) return null

  const ownerName = [lodging.owner.first_name, lodging.owner.last_name]
    .filter((part): part is string => Boolean(part && part.trim().length > 0))
    .join(' ')

  return {
    lodgingId: lodging.id,
    lodgingName: lodging.name,
    citySlug: lodging.city.slug,
    cityName: lodging.city.name,
    ownerName: ownerName === '' ? null : ownerName,
  }
}
