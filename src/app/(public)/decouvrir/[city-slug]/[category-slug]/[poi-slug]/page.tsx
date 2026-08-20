import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DiscoveryPoiView } from '@/features/public-discovery/components/DiscoveryPoiView'
import { getDiscoveryPoi } from '@/features/public-discovery/queries/public-discovery'
import { discoveryPoiMetadata } from '@/features/seo/lib/metadata'
import { breadcrumbSchema, localBusinessSchema } from '@/features/seo/lib/structured-data'
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
        localBusinessSchema({
          name: poi.name,
          description: poi.description,
          address: poi.address,
          latitude: poi.latitude,
          longitude: poi.longitude,
          phone: poi.phone,
          website: poi.website,
          rating: poi.rating,
          ratingCount: poi.rating_count ?? 0,
          hours: poi.hours,
          photos: poi.photos,
          cityName: poi.city.name,
          cityRegion: poi.city.region,
          postalCode: poi.city.postal_code,
          path: poiPath,
        }),
      ]} />
      <DiscoveryPoiView poi={poi} />
    </>
  )
}
