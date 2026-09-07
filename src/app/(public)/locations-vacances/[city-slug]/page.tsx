import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocalSeoDestination, localSeoDestinations } from '@/features/local-seo/content/destinations'
import { LocalVacationRentalLanding } from '@/features/local-seo/components/LocalVacationRentalLanding'
import { localSeoMetadata } from '@/features/local-seo/lib/metadata'
import { localSeoPath } from '@/features/local-seo/lib/paths'
import { listPublishedMarketingLodgingsForCity } from '@/features/lodging-showcase/queries/public-lodgings'
import { breadcrumbSchema, lodgingItemListSchema } from '@/features/seo/lib/structured-data'
import { JsonLd } from '@/shared/components/JsonLd'

type PageProps = {
  params: Promise<{ 'city-slug': string }>
}

export function generateStaticParams() {
  return localSeoDestinations.map(destination => ({ 'city-slug': destination.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { 'city-slug': citySlug } = await params
  const destination = getLocalSeoDestination(citySlug)
  if (!destination) {
    return {
      title: 'Destination introuvable',
      robots: { index: false, follow: false },
    }
  }

  const lodgings = await listPublishedMarketingLodgingsForCity(citySlug)
  return localSeoMetadata(destination, 'vacation-rental', lodgings.length > 0)
}

export default async function VacationRentalCityPage({ params }: PageProps) {
  const { 'city-slug': citySlug } = await params
  const destination = getLocalSeoDestination(citySlug)
  if (!destination) {
    notFound()
    return null
  }

  const lodgings = await listPublishedMarketingLodgingsForCity(citySlug)
  const path = localSeoPath('vacation-rental', destination.slug)
  const breadcrumb = breadcrumbSchema([
    { name: 'Accueil', path: '/' },
    { name: 'Logements', path: '/logements' },
    { name: destination.services.vacationRental.h1, path },
  ])
  const schemas: object[] = [breadcrumb]
  if (lodgings.length > 0) {
    schemas.push(lodgingItemListSchema({
      cityName: destination.name,
      citySlug: destination.slug,
      items: lodgings,
    }))
  }

  return (
    <>
      <JsonLd data={schemas} />
      <LocalVacationRentalLanding destination={destination} lodgings={lodgings} />
    </>
  )
}
