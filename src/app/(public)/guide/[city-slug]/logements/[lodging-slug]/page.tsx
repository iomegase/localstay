import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { lodgingDetailMetadata } from '@/features/seo/lib/metadata'
import {
  breadcrumbSchema,
  lodgingPlaceSchema,
  vacationRentalSchema,
} from '@/features/seo/lib/structured-data'
import { getPublishedLodgingDetail } from '@/features/lodging-showcase/queries/public-lodgings'
import { JsonLd } from '@/shared/components/JsonLd'
import { LodgingGallery } from '@/features/lodging-showcase/components/LodgingGallery'
import { LodgingFacts } from '@/features/lodging-showcase/components/LodgingFacts'
import { AmenitiesGrid } from '@/features/lodging-showcase/components/AmenitiesGrid'
import { OwnerRecommendationsBlock } from '@/features/lodging-showcase/components/OwnerRecommendationsBlock'
import { ExternalBookingCta } from '@/features/lodging-showcase/components/ExternalBookingCta'

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
    preciseLocationPublic: false,
    publicLatitude: null,
    publicLongitude: null,
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
      <div className="space-y-8 px-4 pb-28 pt-6">
        <header className="space-y-4">
          <Link href={`/guide/${citySlug}/logements`} className="text-sm text-gray-500 underline underline-offset-4">
            Retour aux logements
          </Link>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{detail.property_type}</p>
            <h1 className="text-3xl font-light text-charcoal">{detail.title}</h1>
            {detail.public_area_label && <p className="text-sm text-gray-500">{detail.public_area_label}</p>}
          </div>
        </header>

        <LodgingGallery title={detail.title} photos={detail.photos} />

        <LodgingFacts
          maxGuests={detail.max_guests}
          bedroomCount={detail.bedroom_count}
          bathroomCount={detail.bathroom_count}
          bedCount={detail.bed_count}
          surfaceM2={detail.surface_m2}
        />

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-light text-charcoal">Presentation</h2>
          <p className="mt-4 text-sm leading-7 text-gray-600">{detail.description}</p>
        </section>

        <AmenitiesGrid amenities={detail.amenities} />

        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-light text-charcoal">Autour du logement</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            Retrouvez les bonnes adresses, les activites et les idees de sortie dans le guide local MyStay de {detail.city_name}.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/guide/${citySlug}`} className="rounded-full bg-stone-100 px-4 py-2 text-sm text-charcoal">
              Ouvrir le guide
            </Link>
            <Link href={`/guide/${citySlug}/agenda`} className="rounded-full bg-stone-100 px-4 py-2 text-sm text-charcoal">
              Voir l'agenda
            </Link>
          </div>
        </section>

        <OwnerRecommendationsBlock citySlug={citySlug} items={detail.owner_recommendations} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex gap-3">
          <ExternalBookingCta
            externalBookingUrl={detail.external_booking_url}
            platform={detail.external_booking_platform}
            className="flex-1 justify-center rounded-full bg-charcoal px-4 py-3 text-sm text-white"
          />
          {detail.public_contact_enabled && (
            <Link
              href={`/contact?lodging=${detail.id}`}
              className="flex-1 rounded-full border border-charcoal px-4 py-3 text-center text-sm text-charcoal"
            >
              Contacter l'hote
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
