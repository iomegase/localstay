import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DiscoveryPoiView } from '@/features/public-discovery/components/DiscoveryPoiView'
import { getDiscoveryPoi } from '@/features/public-discovery/queries/public-discovery'
import { discoveryPoiMetadata } from '@/features/seo/lib/metadata'
import { breadcrumbSchema, discoveryPoiSchema } from '@/features/seo/lib/structured-data'
import { JsonLd } from '@/shared/components/JsonLd'

type PageProps = {
  params: Promise<{
    'city-slug': string
    'category-slug': string
    'poi-slug': string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const {
    'city-slug': citySlug,
    'category-slug': categorySlug,
    'poi-slug': poiSlug,
  } = await params
  const poi = await getDiscoveryPoi(citySlug, categorySlug, poiSlug)
  return poi
    ? discoveryPoiMetadata(poi)
    : { title: 'Adresse introuvable', robots: { index: false, follow: false } }
}

export default async function DiscoveryPoiPage({ params }: PageProps) {
  const {
    'city-slug': citySlug,
    'category-slug': categorySlug,
    'poi-slug': poiSlug,
  } = await params
  const poi = await getDiscoveryPoi(citySlug, categorySlug, poiSlug)

  if (!poi) {
    notFound()
    return null
  }

  const cityPath = `/decouvrir/${poi.city.slug}`
  const categoryPath = `${cityPath}/${poi.category.slug}`
  const poiPath = `${categoryPath}/${poi.slug}`

  return (
    <>
      <JsonLd data={[
        breadcrumbSchema([
          { name: 'Accueil', path: '/' },
          { name: poi.city.name, path: cityPath },
          { name: poi.category.name, path: categoryPath },
          { name: poi.name, path: poiPath },
        ]),
        discoveryPoiSchema(poi),
      ]} />
      <DiscoveryPoiView poi={poi} />
    </>
  )
}
