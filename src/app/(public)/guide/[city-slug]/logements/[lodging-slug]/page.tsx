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
import { LodgingMarketingGallery } from '@/features/lodging-showcase/components/LodgingMarketingGallery'
import { LodgingEssentials } from '@/features/lodging-showcase/components/LodgingEssentials'
import { LodgingFeatureSections } from '@/features/lodging-showcase/components/LodgingFeatureSections'
import { LodgingRoomsGrid } from '@/features/lodging-showcase/components/LodgingRoomsGrid'
import { LodgingLocationMap } from '@/features/lodging-showcase/components/LodgingLocationMap'
import { LodgingFaq } from '@/features/lodging-showcase/components/LodgingFaq'
import { ExternalBookingCta } from '@/features/lodging-showcase/components/ExternalBookingCta'
import { contextualContactPath } from '@/features/city-guide/lib/public-paths'
import { MarketingShell } from '@/features/marketing/components/MarketingShell'
import {
  marketingContainerClass,
  marketingDarkButtonClass,
  marketingPrimaryButtonClass,
} from '@/features/marketing/components/marketing-styles'

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
  const contactHref = `${contextualContactPath(citySlug)}?lodging=${detail.id}`
  const descriptionParagraphs = detail.description
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)

  return (
    <>
      <JsonLd data={[breadcrumb, rentalSchema ?? fallbackSchema]} />

      <MarketingShell>
        <div className="overflow-hidden font-sans text-slate-800">
          <section
            data-testid="lodging-detail-heading"
            className={`${marketingContainerClass} pb-8 pt-9 md:pb-9 md:pt-12 xl:pb-8 xl:pt-10`}
          >
            <Link
              href="/logements"
              className="group flex w-fit items-center text-[12px] font-bold text-slate-500 transition-colors hover:text-pink-600"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-1" strokeWidth={2} />
              Tous les logements
            </Link>

            <div className="mt-8 flex flex-col gap-7 md:mt-10 md:flex-row md:items-end md:justify-between md:gap-10">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-pink-600">
                  {detail.public_area_label ?? detail.city_name}
                </span>
                <h1 className="mt-3 max-w-[760px] text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] text-slate-800 sm:text-[50px] xl:text-[56px]">
                  {detail.title}
                </h1>
                <div className="mt-4 flex items-center text-[14px] font-medium text-slate-500">
                  <MapPin className="mr-2 h-4 w-4 shrink-0 text-pink-600" strokeWidth={2} />
                  {detail.property_type} à {detail.city_name}
                </div>
              </div>

              <ExternalBookingCta
                externalBookingUrl={detail.external_booking_url}
                platform={detail.external_booking_platform}
                citySlug={citySlug}
                lodgingId={detail.id}
                className={`${marketingDarkButtonClass} shrink-0 px-7`}
              />
            </div>
          </section>

          <LodgingMarketingGallery title={detail.title} photos={detail.photos} />

          <LodgingEssentials
            title={detail.title}
            maxGuests={detail.max_guests}
            bedroomCount={detail.bedroom_count}
            bathroomCount={detail.bathroom_count}
            surfaceM2={detail.surface_m2}
            amenities={[...detail.amenities_included, ...detail.amenities_on_request]}
          />

          <section
            data-testid="lodging-story"
            className={`${marketingContainerClass} grid gap-12 py-16 md:grid-cols-[1.08fr_0.92fr] md:items-start md:gap-14 md:py-20 xl:gap-[84px] xl:py-24`}
          >
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-pink-600">
                Le logement
              </span>
              <h2 className="mt-4 text-[16px] font-semibold leading-[1.7] tracking-[-0.01em] text-slate-800">
                {detail.short_description}
              </h2>
              <div className="mt-7 space-y-5">
                {descriptionParagraphs.map(paragraph => (
                  <p key={paragraph} className="whitespace-pre-line text-[15px] leading-[1.85] text-slate-500">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <aside
              data-testid="lodging-stay-card"
              className="rounded-[26px] bg-[#f8f7f5] p-7 md:sticky md:top-8 xl:p-8"
            >
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-pink-600">
                Votre séjour
              </span>
              <h3 className="mt-3 text-[26px] font-semibold tracking-[-0.04em] text-slate-800">
                {detail.title}
              </h3>
              <p className="mt-6 text-[13px] leading-relaxed text-slate-500">
                {detail.property_type} · {detail.max_guests} {detail.max_guests > 1 ? 'voyageurs' : 'voyageur'}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                {detail.public_area_label ?? detail.city_name}
              </p>

              {detail.public_contact_enabled && (
                <Link
                  href={contactHref}
                  data-analytics-event="lodging_contact_click"
                  data-analytics-city-slug={citySlug}
                  data-analytics-lodging-id={detail.id}
                  className={`${marketingPrimaryButtonClass} mt-7 w-full`}
                >
                  Contacter
                </Link>
              )}
            </aside>
          </section>

          <LodgingFeatureSections
            includedAmenities={detail.amenities_included}
            onRequestAmenities={detail.amenities_on_request}
          />

          <div className={`${marketingContainerClass} space-y-16 pb-16 md:space-y-20 md:pb-24`}>
            <LodgingRoomsGrid photos={detail.photos} />

            {detail.precise_location_public && detail.public_latitude != null && detail.public_longitude != null && (
              <LodgingLocationMap
                latitude={detail.public_latitude}
                longitude={detail.public_longitude}
                areaLabel={detail.public_area_label}
              />
            )}

            <LodgingFaq items={detail.faq} />

            {(detail.external_booking_url || detail.public_contact_enabled) && (
              <section className="flex flex-col items-start gap-8 rounded-[28px] bg-slate-800 px-7 py-10 text-white md:flex-row md:items-end md:justify-between md:px-10 md:py-12">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-pink-300">
                    Réserver ce logement
                  </span>
                  <h2 className="mt-3 max-w-[600px] text-[30px] font-semibold leading-[1.08] tracking-[-0.04em] md:text-[38px]">
                    Envie de séjourner au {detail.title} ?
                  </h2>
                  <p className="mt-4 max-w-[560px] text-[14px] leading-relaxed text-slate-300">
                    Consultez la plateforme de réservation ou contactez directement l&apos;équipe MyStay.
                  </p>
                </div>

                <div className="flex w-full shrink-0 flex-col gap-3 md:w-auto">
                  <ExternalBookingCta
                    externalBookingUrl={detail.external_booking_url}
                    platform={detail.external_booking_platform}
                    citySlug={citySlug}
                    lodgingId={detail.id}
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 text-xs font-bold text-slate-800 transition-colors hover:bg-pink-600 hover:text-white"
                  />
                  {detail.public_contact_enabled && (
                    <Link
                      href={contactHref}
                      data-analytics-event="lodging_contact_click"
                      data-analytics-city-slug={citySlug}
                      data-analytics-lodging-id={detail.id}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/30 px-6 text-xs font-bold text-white transition-colors hover:border-pink-600 hover:bg-pink-600"
                    >
                      Contacter
                    </Link>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </MarketingShell>
    </>
  )
}
