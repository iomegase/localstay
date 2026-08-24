import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DiscoveryCategoryView } from '@/features/public-discovery/components/DiscoveryCategoryView'
import { getDiscoveryCategory } from '@/features/public-discovery/queries/public-discovery'
import { discoveryCategoryMetadata } from '@/features/seo/lib/metadata'
import { breadcrumbSchema, discoveryItemListSchema } from '@/features/seo/lib/structured-data'
import { JsonLd } from '@/shared/components/JsonLd'

type PageProps = {
  params: Promise<{ 'city-slug': string; 'category-slug': string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { 'city-slug': citySlug, 'category-slug': categorySlug } = await params
  const category = await getDiscoveryCategory(citySlug, categorySlug)
  return category
    ? discoveryCategoryMetadata(category)
    : { title: 'Sélection introuvable', robots: { index: false, follow: false } }
}

export default async function DiscoveryCategoryPage({ params }: PageProps) {
  const { 'city-slug': citySlug, 'category-slug': categorySlug } = await params
  const category = await getDiscoveryCategory(citySlug, categorySlug)

  if (!category) {
    notFound()
    return null
  }

  const cityPath = `/decouvrir/${category.city.slug}`
  const categoryPath = `${cityPath}/${category.slug}`

  return (
    <>
      <JsonLd data={[
        breadcrumbSchema([
          { name: 'Accueil', path: '/' },
          { name: category.city.name, path: cityPath },
          { name: category.name, path: categoryPath },
        ]),
        discoveryItemListSchema({
          name: `${category.name} à ${category.city.name}`,
          items: category.pois.map(poi => ({
            name: poi.name,
            path: `${categoryPath}/${poi.slug}`,
          })),
        }),
      ]} />
      <DiscoveryCategoryView category={category} />
    </>
  )
}
