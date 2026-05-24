import { notFound } from 'next/navigation'
import { prisma } from '@/shared/lib/prisma'
import { getPageOwner } from '@/features/dashboard-owner/lib/get-page-owner'
import { getLodgingCustomization } from '@/features/guide-customization/queries/customization'
import { CustomizationForm } from '@/features/guide-customization/components/CustomizationForm'

interface Props {
  params: Promise<{ id: string }>
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default async function CustomizeLodgingPage({ params }: Props) {
  const owner = await getPageOwner()
  const { id } = await params

  const lodging = await prisma.lodging.findFirst({
    where: { id, owner_id: owner.id, deleted_at: null, is_active: true },
    select: {
      id: true,
      name: true,
      city: {
        select: {
          id: true,
          name: true,
          slug: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  })

  if (!lodging) {
    notFound()
    return null
  }

  const [customization, categories, pois] = await Promise.all([
    getLodgingCustomization(owner.id, lodging.id),
    prisma.category.findMany({
      where: {
        deleted_at: null,
        is_active: true,
        pois: {
          some: {
            city_id: lodging.city.id,
            deleted_at: null,
            is_active: true,
          },
        },
      },
      orderBy: { sort_order: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        sort_order: true,
      },
    }),
    prisma.pointOfInterest.findMany({
      where: {
        city_id: lodging.city.id,
        deleted_at: null,
        is_active: true,
        geocode_status: { not: 'rejected' },
      },
      orderBy: [{ category: { sort_order: 'asc' } }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        geocode_status: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
  ])

  const visiblePois = pois
    .filter(poi => {
      if (poi.geocode_status !== 'success') return true
      const distanceKm = haversineKm(
        lodging.city.latitude,
        lodging.city.longitude,
        poi.latitude,
        poi.longitude,
      )
      return distanceKm <= 30
    })
    .map(poi => ({
      id: poi.id,
      name: poi.name,
      category_id: poi.category.id,
      category_slug: poi.category.slug,
      category_name: poi.category.name,
    }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif italic text-2xl text-foreground">Personnaliser le guide</h1>
        <p className="text-sm text-muted-foreground">
          {lodging.name} - {lodging.city.name}
        </p>
      </div>

      <CustomizationForm
        lodgingId={lodging.id}
        citySlug={lodging.city.slug}
        categories={categories}
        pois={visiblePois}
        initialCustomization={customization}
      />
    </div>
  )
}
