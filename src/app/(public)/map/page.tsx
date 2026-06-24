import { redirect } from 'next/navigation'
import { prisma } from '@/shared/lib/prisma'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { getCategoryColor } from '@/features/categories/lib/category-style'
import { GuestMap, type GuestMapPoi } from './_components/GuestMap'

export const dynamic = 'force-dynamic'

export default async function GuestMapPage() {
  const lodgingContext = await getActiveLodgingContext()
  if (!lodgingContext) redirect('/')

  const featured = await prisma.lodgingFeaturedPoi.findMany({
    where: { lodging_id: lodgingContext.lodgingId, deleted_at: null },
    orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    select: {
      owner_note: true,
      poi: {
        select: {
          id: true,
          name: true,
          slug: true,
          latitude: true,
          longitude: true,
          photos: true,
          rating: true,
          category: { select: { name: true, slug: true, icon: true } },
          city: { select: { slug: true } },
        },
      },
    },
  })

  const pois: GuestMapPoi[] = featured
    .filter(
      row =>
        Number.isFinite(row.poi.latitude) && Number.isFinite(row.poi.longitude),
    )
    .map(row => ({
      id: row.poi.id,
      name: row.poi.name,
      slug: row.poi.slug,
      latitude: row.poi.latitude,
      longitude: row.poi.longitude,
      photo_url: row.poi.photos?.[0] ?? null,
      rating: row.poi.rating,
      owner_note: row.owner_note,
      categoryName: row.poi.category.name,
      categorySlug: row.poi.category.slug,
      categoryIcon: row.poi.category.icon,
      categoryColor: getCategoryColor(row.poi.category.slug),
      citySlug: row.poi.city?.slug ?? lodgingContext.citySlug,
    }))

  return <GuestMap pois={pois} />
}
