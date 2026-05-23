import { notFound } from 'next/navigation'
import { getPoiDetail } from '@/features/categories/queries/poi-detail'
import { PoiDetailBody } from '@/features/categories/components/PoiDetailBody'

interface Props {
  params: Promise<{ 'city-slug': string; 'category-slug': string; 'poi-slug': string }>
}

export default async function PoiDetailPage({ params }: Props) {
  const { 'city-slug': citySlug, 'category-slug': categorySlug, 'poi-slug': poiSlug } = await params

  const poi = await getPoiDetail(citySlug, categorySlug, poiSlug)
  if (!poi) { notFound(); return null }

  return (
    <PoiDetailBody poi={poi} citySlug={citySlug} categorySlug={categorySlug} />
  )
}
