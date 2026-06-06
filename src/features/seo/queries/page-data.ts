import { cache } from 'react'
import { prisma } from '@/shared/lib/prisma'

/** Champs légers pour le <title>/canonical d'une page ville (mémoïsé par requête). */
export const getCityForSeo = cache(async (slug: string) => {
  return prisma.city.findFirst({
    where: { slug, is_active: true, deleted_at: null },
    select: { name: true, slug: true, region: true },
  })
})

/** Noms ville + catégorie pour le <title>/canonical d'une page catégorie. */
export const getCategoryForSeo = cache(async (citySlug: string, categorySlug: string) => {
  const [city, category] = await Promise.all([
    prisma.city.findFirst({
      where: { slug: citySlug, is_active: true, deleted_at: null },
      select: { name: true },
    }),
    prisma.category.findFirst({
      where: { slug: categorySlug, is_active: true, deleted_at: null },
      select: { name: true },
    }),
  ])
  if (!city || !category) return null
  return { cityName: city.name, categoryName: category.name }
})
