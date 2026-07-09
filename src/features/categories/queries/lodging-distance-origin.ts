import { prisma } from '@/shared/lib/prisma'

export type LodgingDistanceOrigin = {
  latitude: number
  longitude: number
}

export async function getLodgingDistanceOrigin(
  cityId: string,
  lodgingId?: string | null,
): Promise<LodgingDistanceOrigin | null> {
  if (!lodgingId) return null

  const lodging = await prisma.lodging.findFirst({
    where: {
      id: lodgingId,
      city_id: cityId,
      deleted_at: null,
      is_active: true,
    },
    select: {
      customization: {
        select: {
          lodging_latitude: true,
          lodging_longitude: true,
        },
      },
    },
  })

  const coordinates = lodging?.customization
  if (
    typeof coordinates?.lodging_latitude !== 'number' ||
    typeof coordinates.lodging_longitude !== 'number'
  ) {
    return null
  }

  return {
    latitude: coordinates.lodging_latitude,
    longitude: coordinates.lodging_longitude,
  }
}
