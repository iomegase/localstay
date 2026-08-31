import { notFound } from 'next/navigation'
import { TrailStartModal } from '@/features/trail-navigation/components/TrailStartModal'
import { getPublishedTrail } from '@/features/trails-acquisition/queries/public-trails'
import type { TrailNavigationData } from '@/features/trail-navigation/types'
import { requireActiveLodgingContext } from '@/features/public-menu/lib/private-stay-guard'

interface Props {
  params: Promise<{ 'city-slug': string; 'category-slug': string; 'poi-slug': string }>
}

/**
 * Route interceptée : ouverture en overlay de la navigation rando lors d'une navigation
 * client depuis la liste. La fermeture (croix) appelle `router.back()` côté client
 * (TrailStartModal) → retour à la liste, slot @modal réinitialisé.
 */
export default async function TrailNavigationStartModal({ params }: Props) {
  const { 'city-slug': citySlug, 'category-slug': categorySlug, 'poi-slug': poiSlug } = await params
  await requireActiveLodgingContext(citySlug)
  const trail = await getPublishedTrail(citySlug, poiSlug)
  if (!trail) {
    notFound()
    return null
  }

  return <TrailStartModal trail={trail as TrailNavigationData} backHref={`/guide/${citySlug}/${categorySlug}`} />
}
