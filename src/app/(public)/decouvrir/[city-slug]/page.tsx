import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DiscoveryCityView } from '@/features/public-discovery/components/DiscoveryCityView'
import { getDiscoveryCity } from '@/features/public-discovery/queries/public-discovery'
import { discoveryCityMetadata } from '@/features/seo/lib/metadata'
import { breadcrumbSchema, discoveryItemListSchema } from '@/features/seo/lib/structured-data'
import { JsonLd } from '@/shared/components/JsonLd'

type PageProps = { params: Promise<{ 'city-slug': string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { 'city-slug': citySlug } = await params
  const city = await getDiscoveryCity(citySlug)
  return city
    ? discoveryCityMetadata(city)
    : { title: 'Destination introuvable', robots: { index: false, follow: false } }
}

export default async function DiscoveryCityPage({ params }: PageProps) {
  const { 'city-slug': citySlug } = await params
  const city = await getDiscoveryCity(citySlug)

  if (!city) {
    notFound()
    return null
  }

  const path = `/decouvrir/${city.slug}`
  const visiblePois = city.categories.flatMap(category => category.pois)

  return (
    <>
      <JsonLd data={[
        breadcrumbSchema([
          { name: 'Accueil', path: '/' },
          { name: `Découvrir ${city.name}`, path },
        ]),
        discoveryItemListSchema({
          name: `Sélection locale à ${city.name}`,
          items: visiblePois.map(poi => ({
            name: poi.name,
            path: `${path}/${poi.category.slug}/${poi.slug}`,
          })),
        }),
      ]} />
      <DiscoveryCityView city={city} />
    </>
  )
}
