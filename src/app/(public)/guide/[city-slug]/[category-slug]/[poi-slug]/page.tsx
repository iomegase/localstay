import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getPoiDetail } from '@/features/categories/queries/poi-detail'
import { PoiDetailBody } from '@/features/categories/components/PoiDetailBody'
import { getContextualOwnerNote } from '@/features/guide-customization/queries/contextual-owner-note'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { discoveryPoiMetadata, poiMetadata } from '@/features/seo/lib/metadata'
import { JsonLd } from '@/shared/components/JsonLd'
import {
  breadcrumbSchema,
  localBusinessSchema,
  touristAttractionSchema,
  type PoiSchemaInput,
} from '@/features/seo/lib/structured-data'
import { getDiscoveryPoi } from '@/features/public-discovery/queries/public-discovery'

interface Props {
  params: Promise<{ 'city-slug': string; 'category-slug': string; 'poi-slug': string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'city-slug': citySlug, 'category-slug': categorySlug, 'poi-slug': poiSlug } = await params
  const lodgingContext = await getActiveLodgingContext()
  if (!lodgingContext) {
    const publicPoi = await getDiscoveryPoi(citySlug, categorySlug, poiSlug)
    return publicPoi
      ? discoveryPoiMetadata(publicPoi)
      : { title: 'Adresse introuvable', robots: { index: false, follow: false } }
  }

  const poi = await getPoiDetail(citySlug, categorySlug, poiSlug)
  if (!poi) return { title: 'Adresse introuvable', robots: { index: false } }

  return poiMetadata({
    name: poi.name,
    description: poi.description,
    cityName: poi.city.name,
    categoryName: poi.category.name,
    citySlug,
    categorySlug,
    poiSlug,
    photo: poi.photos[0] ?? null,
  })
}

export default async function PoiDetailPage({ params }: Props) {
  const { 'city-slug': citySlug, 'category-slug': categorySlug, 'poi-slug': poiSlug } = await params

  const lodgingContext = await getActiveLodgingContext()
  if (!lodgingContext) {
    const publicPoi = await getDiscoveryPoi(citySlug, categorySlug, poiSlug)
    if (!publicPoi) {
      notFound()
      return null
    }
    permanentRedirect(`/decouvrir/${citySlug}/${categorySlug}/${poiSlug}`)
  }

  const poi = await getPoiDetail(citySlug, categorySlug, poiSlug, lodgingContext?.lodgingId ?? null)
  if (!poi) { notFound(); return null }

  const ownerRecommendationNote = await getContextualOwnerNote(lodgingContext.lodgingId, poi.id)

  const path = `/guide/${citySlug}/${categorySlug}/${poiSlug}`
  const schemaInput: PoiSchemaInput = {
    name: poi.name,
    description: poi.description,
    address: poi.address,
    latitude: poi.latitude,
    longitude: poi.longitude,
    phone: poi.phone,
    website: poi.website,
    rating: poi.rating,
    ratingCount: poi.rating_count,
    hours: poi.hours,
    photos: poi.photos,
    cityName: poi.city.name,
    cityRegion: poi.city.region,
    postalCode: poi.city.postal_code,
    path,
  }
  const primarySchema = poi.trail_detail ? touristAttractionSchema(schemaInput) : localBusinessSchema(schemaInput)
  const breadcrumb = breadcrumbSchema([
    { name: 'Accueil', path: '/' },
    { name: poi.city.name, path: `/guide/${citySlug}` },
    { name: poi.category.name, path: `/guide/${citySlug}/${categorySlug}` },
    { name: poi.name, path },
  ])

  return (
    <>
      <JsonLd data={[primarySchema, breadcrumb]} />
      <PoiDetailBody
        poi={poi}
        citySlug={citySlug}
        categorySlug={categorySlug}
        ownerRecommendationNote={ownerRecommendationNote}
      />
    </>
  )
}
