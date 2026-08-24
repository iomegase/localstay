import type { Metadata } from 'next'
import { DiscoveryIndexView } from '@/features/public-discovery/components/DiscoveryIndexView'
import { getDiscoveryIndex } from '@/features/public-discovery/queries/public-discovery'
import { discoveryIndexMetadata } from '@/features/seo/lib/metadata'
import { breadcrumbSchema, discoveryItemListSchema } from '@/features/seo/lib/structured-data'
import { JsonLd } from '@/shared/components/JsonLd'

export const metadata: Metadata = discoveryIndexMetadata()

export default async function DiscoveryIndexPage() {
  const cities = await getDiscoveryIndex()

  return (
    <>
      <JsonLd data={[
        breadcrumbSchema([
          { name: 'Accueil', path: '/' },
          { name: 'Découvrir', path: '/decouvrir' },
        ]),
        discoveryItemListSchema({
          name: 'Villes et bonnes adresses MyStay',
          items: cities.map(city => ({ name: city.name, path: `/decouvrir/${city.slug}` })),
        }),
      ]} />
      <DiscoveryIndexView cities={cities} />
    </>
  )
}
