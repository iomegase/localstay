import { notFound, permanentRedirect } from 'next/navigation'

import { publicLodgingPath } from '@/features/lodging-showcase/lib/public-paths'
import { getPublishedLodgingDetail } from '@/features/lodging-showcase/queries/public-lodgings'

interface Props {
  params: Promise<{ 'city-slug': string; 'lodging-slug': string }>
}

export default async function LegacyLodgingDetailPage({ params }: Props) {
  const { 'city-slug': citySlug, 'lodging-slug': lodgingSlug } = await params
  const detail = await getPublishedLodgingDetail(citySlug, lodgingSlug)

  if (!detail) {
    notFound()
    return null
  }

  permanentRedirect(publicLodgingPath(detail.slug))
}
