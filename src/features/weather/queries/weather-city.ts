import { prisma } from '@/shared/lib/prisma'

export type WeatherCity = {
  name: string
  slug: string
  latitude: number
  longitude: number
}

export async function getWeatherCity(slug: string): Promise<WeatherCity | null> {
  return prisma.city.findFirst({
    where: { slug, is_active: true, deleted_at: null },
    select: {
      name: true,
      slug: true,
      latitude: true,
      longitude: true,
    },
  })
}
