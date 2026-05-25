import { prisma } from '@/shared/lib/prisma'
import { TrailsAcquisitionError } from '../lib/errors'

export async function getTrailAcquisitionOptions() {
  const [cities, randoCategory] = await Promise.all([
    prisma.city.findMany({
      where: { is_active: true, deleted_at: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
    prisma.category.findFirst({
      where: { slug: 'rando', is_active: true, deleted_at: null },
      include: {
        subcategories: {
          where: { is_active: true, deleted_at: null },
          orderBy: { sort_order: 'asc' },
          select: { id: true, name: true, slug: true },
        },
      },
    }),
  ])

  if (!randoCategory) throw new TrailsAcquisitionError('INVALID_RANDO_CATEGORY', 400)

  return {
    cities,
    rando_category: {
      id: randoCategory.id,
      name: randoCategory.name,
      slug: randoCategory.slug,
      subcategories: randoCategory.subcategories,
    },
  }
}
