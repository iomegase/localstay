import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, MapPin, SlidersHorizontal } from 'lucide-react'
import { prisma } from '@/shared/lib/prisma'
import { getPageOwner } from '@/features/dashboard-owner/lib/get-page-owner'
import { getLodgingCustomization } from '@/features/guide-customization/queries/customization'
import { CustomizationForm } from '@/features/guide-customization/components/CustomizationForm'

interface Props {
  params: Promise<{ id: string }>
}

// Règle métier strictement non modifiée
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

  // Règle métier strictement non modifiée
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

  // Règle métier strictement non modifiée
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

  // Règle métier strictement non modifiée
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

  const featuredRows = await prisma.lodgingFeaturedPoi.findMany({
    where: { lodging_id: lodging.id, deleted_at: null },
    orderBy: [{ sort_order: 'asc' }],
    select: {
      owner_note: true,
      poi: {
        select: {
          id: true,
          name: true,
          city: { select: { id: true, slug: true, name: true } },
          category: { select: { name: true } },
        },
      },
    },
  })

  const initialOtherCityPois = featuredRows
    .filter(row => row.poi.city.id !== lodging.city.id)
    .map(row => ({
      poi_id: row.poi.id,
      name: row.poi.name,
      category_name: row.poi.category.name,
      city_slug: row.poi.city.slug,
      city_name: row.poi.city.name,
      owner_note: row.owner_note,
    }))

  return (
    <div className="mx-auto w-full max-w-5xl animate-in fade-in space-y-6 duration-500">
      <Link
        href="/dashboard/lodgings"
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 transition-colors hover:text-[#0B1437]"
      >
        <ArrowLeft size={12} />
        Retour aux logements
      </Link>

      <header className="flex flex-col justify-between gap-6 rounded-[25px] border border-gray-50 bg-white p-8 shadow-sm md:flex-row md:items-center">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Personnalisation
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight text-neutral-900">
            <SlidersHorizontal size={28} strokeWidth={2.2} className="text-[#0B1437]" />
            {lodging.name}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm leading-relaxed text-gray-500">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F4F7FE] px-2.5 py-1 text-[11px] font-semibold text-[#0B1437]">
              <MapPin size={11} />
              {lodging.city.name}
            </span>
            Livret d&apos;accueil affiché à vos voyageurs après scan du QR code.
          </p>
        </div>

        <Link
          href={`/guide/${lodging.city.slug}?lodging=${lodging.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 text-[13px] font-bold text-[#0B1437] shadow-sm transition-all hover:border-[#0B1437]/30 hover:bg-gray-50"
        >
          <ExternalLink size={14} className="transition-transform duration-300 group-hover:scale-110" />
          Aperçu voyageur
        </Link>
      </header>

      <CustomizationForm
        lodgingId={lodging.id}
        citySlug={lodging.city.slug}
        categories={categories}
        pois={visiblePois}
        initialCustomization={customization}
        initialOtherCityPois={initialOtherCityPois}
      />
    </div>
  )
}
