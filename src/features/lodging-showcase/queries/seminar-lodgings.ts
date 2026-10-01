import { prisma } from '@/shared/lib/prisma'
import { publicLodgingPath } from '../lib/public-paths'
import { revalidatePublicLodgingPaths } from '../lib/revalidation'

export async function listSeminarLodgings(cityId?: string) {
  const profiles = await prisma.lodgingPublicProfile.findMany({
    where: {
      publication_status: 'published',
      deleted_at: null,
      city: { is_active: true, deleted_at: null },
      lodging: {
        seminar_selected: true,
        is_active: true,
        deleted_at: null,
        city: { is_active: true, deleted_at: null },
        ...(cityId ? { city_id: cityId } : {}),
      },
    },
    orderBy: [{ title: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      title: true,
      slug: true,
      surface_m2: true,
      max_guests: true,
      lodging: { select: { city: { select: { name: true } } } },
      photos: {
        where: { deleted_at: null },
        orderBy: [{ is_cover: 'desc' }, { sort_order: 'asc' }, { created_at: 'asc' }],
        take: 1,
        select: { url: true, alt: true },
      },
    },
  })

  return profiles.map(profile => ({
    id: profile.id,
    title: profile.title,
    surfaceM2: profile.surface_m2,
    maxGuests: profile.max_guests,
    href: publicLodgingPath(profile.slug),
    cityName: profile.lodging.city.name,
    photo: profile.photos[0] ?? null,
  }))
}

export type SeminarLodging = Awaited<ReturnType<typeof listSeminarLodgings>>[number]

export async function setSeminarSelection(id: string, selected: boolean) {
  // The soft-delete predicate is checked in the write, including concurrent deletes.
  const result = await prisma.$transaction(async tx => {
    const changed = await tx.lodging.updateMany({
      where: { id, deleted_at: null },
      data: { seminar_selected: selected },
    })
    if (!changed.count) return null
    return tx.lodging.findUniqueOrThrow({
      where: { id },
      select: { id: true, seminar_selected: true, city: { select: { slug: true } } },
    })
  })

  if (!result) return null
  revalidatePublicLodgingPaths([result.city.slug])
  return { id: result.id, seminar_selected: result.seminar_selected }
}
