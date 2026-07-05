import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin } from 'lucide-react'

import { lodgingDetailMetadata } from '@/features/seo/lib/metadata'
import {
  breadcrumbSchema,
  lodgingPlaceSchema,
  vacationRentalSchema,
} from '@/features/seo/lib/structured-data'
import { getPublishedLodgingDetail } from '@/features/lodging-showcase/queries/public-lodgings'
import { JsonLd } from '@/shared/components/JsonLd'
import { LodgingHeroGallery } from '@/features/lodging-showcase/components/LodgingHeroGallery'
import { LodgingExcerpt } from '@/features/lodging-showcase/components/LodgingExcerpt'
import { LodgingFacts } from '@/features/lodging-showcase/components/LodgingFacts'
import { LodgingAmenitiesGrid } from '@/features/lodging-showcase/components/LodgingAmenitiesGrid'
import { LodgingRoomsGrid } from '@/features/lodging-showcase/components/LodgingRoomsGrid'
import { LodgingLocationMap } from '@/features/lodging-showcase/components/LodgingLocationMap'
import { LodgingFaq } from '@/features/lodging-showcase/components/LodgingFaq'
import { LodgingBookingCta } from '@/features/lodging-showcase/components/LodgingBookingCta'

interface Props {
  params: Promise<{ 'city-slug': string; 'lodging-slug': string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'city-slug': citySlug, 'lodging-slug': lodgingSlug } = await params
  const detail = await getPublishedLodgingDetail(citySlug, lodgingSlug)
  if (!detail) return { title: 'Logement introuvable', robots: { index: false } }

  return lodgingDetailMetadata({
    title: detail.title,
    shortDescription: detail.short_description,
    citySlug,
    lodgingSlug,
    coverPhoto: detail.cover_photo_url,
  })
}

export default async function LodgingDetailPage({ params }: Props) {
  const { 'city-slug': citySlug, 'lodging-slug': lodgingSlug } = await params
  const detail = await getPublishedLodgingDetail(citySlug, lodgingSlug)

  if (!detail) {
    notFound()
    return null
  }

  const breadcrumb = breadcrumbSchema([
    { name: 'Accueil', path: '/' },
    { name: detail.city_name, path: `/guide/${citySlug}` },
    { name: 'Logements', path: `/guide/${citySlug}/logements` },
    { name: detail.title, path: `/guide/${citySlug}/logements/${lodgingSlug}` },
  ])

  const lodgingSchemaInput = {
    id: detail.id,
    title: detail.title,
    shortDescription: detail.short_description,
    description: detail.description,
    cityName: detail.city_name,
    cityRegion: detail.city_region,
    citySlug,
    slug: detail.slug,
    propertyType: detail.property_type,
    maxGuests: detail.max_guests,
    publicAreaLabel: detail.public_area_label,
    preciseLocationPublic: detail.precise_location_public,
    publicLatitude: detail.public_latitude,
    publicLongitude: detail.public_longitude,
    photos: detail.photos.map(photo => ({
      url: photo.url,
      alt: photo.alt,
      is_cover: photo.is_cover,
      room_type: photo.room_type,
    })),
    amenities: detail.amenities.map((label, index) => ({ code: `amenity-${index}`, label })),
  }

  const rentalSchema = vacationRentalSchema(lodgingSchemaInput)
  const fallbackSchema = lodgingPlaceSchema(lodgingSchemaInput)

  return (
    <>
      <JsonLd data={[breadcrumb, rentalSchema ?? fallbackSchema]} />

      <div className="font-sans">
        <LodgingHeroGallery title={detail.title} photos={detail.photos} />

        <div className="mx-4 mt-5 space-y-4">
          <Link
            href={`/guide/${citySlug}/logements`}
            className="group flex w-fit items-center text-[13px] font-medium text-gray-500 transition-colors hover:text-charcoal"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-1" strokeWidth={2} />
            Retour
          </Link>
          <div>
            <span className="inline-block rounded-md bg-[#e8decb] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b6f4e]">
              {detail.property_type}
            </span>
            <h1 className="mt-3 text-[26px] font-semibold leading-tight tracking-tight text-charcoal">{detail.title}</h1>
            {detail.public_area_label && (
              <div className="mt-2 flex items-center text-[13px] font-medium text-gray-500">
                <MapPin className="mr-1.5 h-4 w-4 shrink-0 text-[#003A5D]" strokeWidth={2.5} />
                {detail.public_area_label}
              </div>
            )}
          </div>
        </div>

        <LodgingExcerpt text={detail.short_description} />

        <section className="mx-4 mt-6">
          <p className="mb-2 text-[11px] uppercase tracking-widest text-pink-600">À propos</p>
          <p className="whitespace-pre-line text-[12px] font-light leading-[1.8] text-gray-600">{detail.description}</p>
        </section>

        <div className="mx-4 mt-6">
          <LodgingFacts
            maxGuests={detail.max_guests}
            bedroomCount={detail.bedroom_count}
            bathroomCount={detail.bathroom_count}
            bedCount={detail.bed_count}
            surfaceM2={detail.surface_m2}
          />
        </div>

        <LodgingAmenitiesGrid title="Équipements & Services" subtitle="compris dans le séjour" items={detail.amenities_included} />
        <LodgingAmenitiesGrid title="Services" subtitle="disponible sur demande" items={detail.amenities_on_request} />

        <LodgingRoomsGrid photos={detail.photos} />

        {detail.precise_location_public && detail.public_latitude != null && detail.public_longitude != null && (
          <LodgingLocationMap
            latitude={detail.public_latitude}
            longitude={detail.public_longitude}
            areaLabel={detail.public_area_label}
          />
        )}

        <LodgingFaq items={detail.faq} />

        <LodgingBookingCta
          citySlug={citySlug}
          lodgingId={detail.id}
          publicContactEnabled={detail.public_contact_enabled}
          externalBookingUrl={detail.external_booking_url}
          externalBookingPlatform={detail.external_booking_platform}
        />
      </div>
    </>
  )
}
