import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getPublishedLocalLanding,
  listPublishedLocalLandingSummaries,
} from '@/features/local-seo/queries/landing-pages'
import { LocalConciergeLanding } from '@/features/local-seo/components/LocalConciergeLanding'
import { listPublicLandingReviews } from '@/features/local-seo/queries/landing-reviews'
import { listPublishedLodgings } from '@/features/lodging-showcase/queries/public-lodgings'
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
  return destinations.filter(destination => destination.publication.concierge)
    .map(destination => ({ 'city-slug': destination.city.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { 'city-slug': citySlug } = await params
  const landing = await getPublishedLocalLanding(citySlug, 'CONCIERGE')
  if (!landing) {
    return {
      title: 'Conciergerie locale introuvable',
      robots: { index: false, follow: false },
    }
  }

  return localSeoMetadata(landing, 'concierge')
}

export default async function ConciergeCityPage({ params }: PageProps) {
  const { 'city-slug': citySlug } = await params
  const landing = await getPublishedLocalLanding(citySlug, 'CONCIERGE')
  if (!landing) notFound()

  const path = localSeoPath('concierge', landing.city.slug)
  const breadcrumb = breadcrumbSchema([
    { name: 'Accueil', path: '/' },
    { name: 'Confier mon logement', path: '/confier-mon-logement' },
    { name: landing.page.h1, path },
  ])
  const service = localServiceSchema(landing, 'concierge')
  const [lodgings, reviews] = await Promise.all([
    listPublishedLodgings({ limit: 3 }),
    listPublicLandingReviews(landing.city.slug),
  ])

  return (
    <>
      <JsonLd data={[breadcrumb, service]} />
      <LocalConciergeLanding
        landing={landing}
        lodgings={lodgings}
        reviews={reviews}
      />
    </>
  )
}
