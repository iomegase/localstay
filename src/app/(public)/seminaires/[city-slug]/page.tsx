import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getPublishedLocalLanding,
  listPublishedLocalLandingSummaries,
} from '@/features/local-seo/queries/landing-pages'
import { LocalServiceLanding } from '@/features/local-seo/components/LocalServiceLanding'
import { localSeoMetadata } from '@/features/local-seo/lib/metadata'
import { localSeoPath } from '@/features/local-seo/lib/paths'
import { localServiceSchema } from '@/features/local-seo/lib/structured-data'
import { breadcrumbSchema } from '@/features/seo/lib/structured-data'
import { JsonLd } from '@/shared/components/JsonLd'

type PageProps = {
  params: Promise<{ 'city-slug': string }>
}

export async function generateStaticParams() {
  const destinations = await listPublishedLocalLandingSummaries()
  return destinations.filter(destination => destination.publication.seminar)
    .map(destination => ({ 'city-slug': destination.city.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { 'city-slug': citySlug } = await params
  const landing = await getPublishedLocalLanding(citySlug, 'SEMINAR')
  if (!landing) {
    return {
      title: 'Séminaire local introuvable',
      robots: { index: false, follow: false },
    }
  }

  return localSeoMetadata(landing, 'seminar')
}

export default async function SeminarCityPage({ params }: PageProps) {
  const { 'city-slug': citySlug } = await params
  const landing = await getPublishedLocalLanding(citySlug, 'SEMINAR')
  if (!landing) notFound()

  const path = localSeoPath('seminar', landing.city.slug)
  const breadcrumb = breadcrumbSchema([
    { name: 'Accueil', path: '/' },
    { name: 'Séminaires', path: '/seminaires' },
    { name: landing.page.h1, path },
  ])
  const service = localServiceSchema(landing, 'seminar')

  return (
    <>
      <JsonLd data={[breadcrumb, service]} />
      <LocalServiceLanding landing={landing} />
    </>
  )
}
