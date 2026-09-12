import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublishedLocalLanding, listPublishedLocalLandingSummaries } from '@/features/local-seo/queries/landing-pages'
import { LocalVacationRentalLanding } from '@/features/local-seo/components/LocalVacationRentalLanding'
import { localSeoMetadata } from '@/features/local-seo/lib/metadata'
import { localSeoPath } from '@/features/local-seo/lib/paths'
import { listPublishedMarketingLodgingsForCity } from '@/features/lodging-showcase/queries/public-lodgings'
import { breadcrumbSchema, lodgingItemListSchema } from '@/features/seo/lib/structured-data'
import { JsonLd } from '@/shared/components/JsonLd'

type PageProps = {
  params: Promise<{ 'city-slug': string }>
}

export async function generateStaticParams() {
  const destinations = await listPublishedLocalLandingSummaries()
  return destinations.filter(destination => destination.publication.vacationRental)
    .map(destination => ({ 'city-slug': destination.city.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { 'city-slug': citySlug } = await params
  const landing = await getPublishedLocalLanding(citySlug, 'VACATION_RENTAL')
  if (!landing) {
    return {
      title: 'Destination introuvable',
      robots: { index: false, follow: false },
    }
  }

  return localSeoMetadata(landing, 'vacation-rental')
}

export default async function VacationRentalCityPage({ params }: PageProps) {
  const { 'city-slug': citySlug } = await params
  const landing = await getPublishedLocalLanding(citySlug, 'VACATION_RENTAL')
  if (!landing) notFound()

  const lodgings = await listPublishedMarketingLodgingsForCity(citySlug)
  const path = localSeoPath('vacation-rental', landing.city.slug)
  const breadcrumb = breadcrumbSchema([
    { name: 'Accueil', path: '/' },
    { name: 'Logements', path: '/logements' },
    { name: landing.page.h1, path },
  ])
  const schemas: object[] = [breadcrumb]
  if (lodgings.length > 0) {
    schemas.push({
      ...lodgingItemListSchema({
        cityName: landing.city.name,
        citySlug: landing.city.slug,
        items: lodgings,
      }),
      name: landing.page.h1,
      description: landing.page.meta_description,
    })
  }

  return (
    <>
      <JsonLd data={schemas} />
      <LocalVacationRentalLanding landing={landing} lodgings={lodgings} />
    </>
  )
}
