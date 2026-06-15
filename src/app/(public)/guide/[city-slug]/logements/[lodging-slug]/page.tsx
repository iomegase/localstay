import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, Compass, CalendarDays } from 'lucide-react'

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
import { contextualContactPath } from '@/features/city-guide/lib/public-paths'

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
      
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 font-sans">
        
        {/* En-tête de page premium */}
        <header className="mb-6 space-y-5">
          <Link 
            href={`/guide/${citySlug}/logements`} 
            className="group inline-flex items-center text-[15px] font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-1" strokeWidth={2} />
            Retour
          </Link>

          <div>
            {/* Badge type de propriété coloré */}
            <span className="mb-3 inline-block rounded-md bg-[#e8decb] px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#8b6f4e]">
              {detail.property_type}
            </span>
            
            <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-4xl">
              {detail.title}
            </h1>
            
            {detail.public_area_label && (
              <div className="mt-3 flex items-center text-[15px] font-medium text-gray-500">
                <MapPin className="mr-1.5 h-4 w-4 text-[#003A5D]" strokeWidth={2.5} />
                {detail.public_area_label}
              </div>
            )}
          </div>
        </header>

        {/* Section Galerie : Bords adoucis avec une ombre subtile */}
        <div className="mb-10 overflow-hidden rounded-2xl bg-gray-100 shadow-md">
          <LodgingGallery title={detail.title} photos={detail.photos} />
        </div>

        {/* Colonne centrale épurée */}
        <div className="mx-auto max-w-3xl space-y-10">
          
          {/* Ligne des caractéristiques (gérée par LodgingFacts, encadrée d'une ligne douce) */}
          <div className="border-b border-gray-100 pb-8">
            <LodgingFacts
              maxGuests={detail.max_guests}
              bedroomCount={detail.bedroom_count}
              bathroomCount={detail.bathroom_count}
              bedCount={detail.bed_count}
              surfaceM2={detail.surface_m2}
            />
          </div>

          {/* Section Présentation (Design typographique aéré) */}
          <section>
            <h2 className="mb-4 text-[22px] font-semibold text-gray-900">
              À propos de ce logement
            </h2>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-gray-600">
              {detail.description}
            </p>
          </section>

          {/* Section Équipements */}
          <section className="border-t border-gray-100 pt-8">
             <h2 className="mb-6 text-[22px] font-semibold text-gray-900">
              Équipements
            </h2>
            <AmenitiesGrid amenities={detail.amenities} />
          </section>

          {/* Section Guide Local (Boutons repensés style "Cards") */}
          <section className="border-t border-gray-100 pt-8">
            <h2 className="mb-3 text-[22px] font-semibold text-gray-900">
              Autour du logement
            </h2>
            <p className="mb-6 text-[15px] leading-relaxed text-gray-600">
              Retrouvez les bonnes adresses, les activités et les idées de sortie dans le guide local MyStay de {detail.city_name}.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link 
                href={`/guide/${citySlug}`} 
                className="group flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-4 text-[15px] font-semibold text-gray-900 shadow-sm transition-all hover:border-gray-900 hover:bg-gray-50"
              >
                <Compass className="h-5 w-5 text-gray-500 transition-colors group-hover:text-gray-900" strokeWidth={2} />
                Explorer le guide
              </Link>
              <Link 
                href={`/guide/${citySlug}/agenda`} 
                className="group flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-4 text-[15px] font-semibold text-gray-900 shadow-sm transition-all hover:border-gray-900 hover:bg-gray-50"
              >
                <CalendarDays className="h-5 w-5 text-gray-500 transition-colors group-hover:text-gray-900" strokeWidth={2} />
                Voir l'agenda
              </Link>
            </div>
          </section>

          <div className="border-t border-gray-100 pt-8">
            <OwnerRecommendationsBlock citySlug={citySlug} items={detail.owner_recommendations} />
          </div>

          <section className="border-t border-gray-100 pt-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="space-y-2">
                <h2 className="text-[22px] font-semibold text-gray-900">Réserver ou contacter</h2>
                <p className="text-[15px] leading-relaxed text-gray-600">
                  Vérifiez les disponibilités ou posez vos questions directement depuis la fiche.
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                {detail.public_contact_enabled && (
                  <Link
                    href={`${contextualContactPath(citySlug)}?lodging=${detail.id}`}
                    className="w-full rounded-xl border border-gray-300 bg-white px-6 py-3.5 text-center text-[15px] font-semibold text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
                  >
                    Contacter
                  </Link>
                )}

                <ExternalBookingCta
                  externalBookingUrl={detail.external_booking_url}
                  platform={detail.external_booking_platform}
                  className="w-full justify-center rounded-xl bg-[#003A5D] px-7 py-3.5 text-center text-[15px] font-semibold text-white shadow-md transition-all hover:bg-[#002a43]"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
