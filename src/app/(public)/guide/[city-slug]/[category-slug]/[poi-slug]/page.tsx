import { notFound } from 'next/navigation'
import { getPoiDetail } from '@/features/categories/queries/poi-detail'
import { PoiDetailBody } from '@/features/categories/components/PoiDetailBody'

interface Props {
  params: { 'city-slug': string; 'category-slug': string; 'poi-slug': string }
}

export default async function PoiDetailPage({ params }: Props) {
  const citySlug = params['city-slug']
  const categorySlug = params['category-slug']
  const poiSlug = params['poi-slug']

  const poi = await getPoiDetail(citySlug, categorySlug, poiSlug)
  if (!poi) { notFound(); return null }

  return (
    <PoiDetailBody poi={poi} citySlug={citySlug} categorySlug={categorySlug} />
  )
}
