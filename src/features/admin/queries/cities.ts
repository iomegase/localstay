import { prisma } from '@/shared/lib/prisma'
import { geocodeAddress } from '@/features/geocoding/services/mapbox-client'
import type { CityUpdateInput } from '@/features/admin/schemas/city'

export class CityUpdateError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message)
  }
}

export async function updateAdminCity(slug: string, input: CityUpdateInput) {
  const city = await prisma.city.findFirst({
    where: { slug, deleted_at: null },
    select: { id: true, name: true, postal_code: true, latitude: true, longitude: true },
  })
  if (!city) throw new CityUpdateError('CITY_NOT_FOUND', 'Ville introuvable.', 404)

  let coordinates: { latitude: number; longitude: number } | undefined
  if (city.name !== input.name || city.postal_code !== input.postal_code) {
    let geocode: Awaited<ReturnType<typeof geocodeAddress>>
    try {
      geocode = await geocodeAddress(`${input.name} ${input.postal_code} France`, city)
    } catch {
      throw new CityUpdateError('GEOCODE_FAILED', 'Géocodage indisponible. Réessayez.', 502)
    }
    if (!geocode) {
      throw new CityUpdateError('GEOCODE_NOT_FOUND', 'Aucun résultat Mapbox pour cette ville et ce code postal.', 422)
    }
    coordinates = { latitude: geocode.latitude, longitude: geocode.longitude }
  }

  return prisma.city.update({
    where: { id: city.id, deleted_at: null },
    // Preserve the slug so existing guide links and QR codes remain valid.
    data: { ...input, ...coordinates },
    select: { id: true, name: true, slug: true, postal_code: true },
  })
}
