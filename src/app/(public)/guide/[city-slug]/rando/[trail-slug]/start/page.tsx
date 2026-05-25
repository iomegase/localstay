import { notFound } from 'next/navigation'
import { TrailNavigationMap } from '@/features/trail-navigation/components/TrailNavigationMap'
import { getPublishedTrail } from '@/features/trails-acquisition/queries/public-trails'
import type { TrailNavigationData } from '@/features/trail-navigation/types'

interface Props {
  params: Promise<{ 'city-slug': string; 'trail-slug': string }>
}

export default async function TrailNavigationStartPage({ params }: Props) {
  const { 'city-slug': citySlug, 'trail-slug': trailSlug } = await params
  const trail = await getPublishedTrail(citySlug, trailSlug)
  if (!trail) {
    notFound()
    return null
  }

  return <TrailNavigationMap trail={trail as TrailNavigationData} backHref={`/guide/${citySlug}/rando/${trailSlug}`} />
}
