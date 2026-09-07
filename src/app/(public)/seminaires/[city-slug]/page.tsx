import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getLocalSeoDestination,
  listPublishedServiceDestinations,
} from '@/features/local-seo/content/destinations'
import { LocalServiceLanding } from '@/features/local-seo/components/LocalServiceLanding'
import { localSeoMetadata } from '@/features/local-seo/lib/metadata'
import { localSeoPath } from '@/features/local-seo/lib/paths'
import { localServiceSchema } from '@/features/local-seo/lib/structured-data'
import { breadcrumbSchema } from '@/features/seo/lib/structured-data'
import { JsonLd } from '@/shared/components/JsonLd'

type PageProps = {
  params: Promise<{ 'city-slug': string }>
}

export function generateStaticParams() {
  return listPublishedServiceDestinations('seminar').map(destination => ({
    'city-slug': destination.slug,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { 'city-slug': citySlug } = await params
  const destination = getLocalSeoDestination(citySlug)
  if (!destination || !destination.services.seminar.published) {
    return {
      title: 'Séminaire local introuvable',
      robots: { index: false, follow: false },
    }
  }

  return localSeoMetadata(destination, 'seminar', true)
}

export default async function SeminarCityPage({ params }: PageProps) {
  const { 'city-slug': citySlug } = await params
  const destination = getLocalSeoDestination(citySlug)
  if (!destination || !destination.services.seminar.published) {
    notFound()
    return null
  }

  const path = localSeoPath('seminar', destination.slug)
  const breadcrumb = breadcrumbSchema([
    { name: 'Accueil', path: '/' },
    { name: 'Séminaires', path: '/seminaires' },
    { name: destination.services.seminar.h1, path },
  ])
  const service = localServiceSchema({
    name: destination.services.seminar.h1,
    description: destination.services.seminar.metaDescription,
    cityName: destination.name,
    path,
  })

  return (
    <>
      <JsonLd data={[breadcrumb, service]} />
      <LocalServiceLanding destination={destination} intent="seminar" />
    </>
  )
}
