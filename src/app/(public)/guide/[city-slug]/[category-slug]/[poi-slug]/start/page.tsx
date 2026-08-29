import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PrivateGuideFrame } from '@/features/guide-app/components/PrivateGuideFrame'
import { TrailNavigationMap } from '@/features/trail-navigation/components/TrailNavigationMap'
import { getPublishedTrail } from '@/features/trails-acquisition/queries/public-trails'
import type { TrailNavigationData } from '@/features/trail-navigation/types'
import { privatePageMetadata } from '@/features/seo/lib/private-metadata'

interface Props {
  params: Promise<{ 'city-slug': string; 'category-slug': string; 'poi-slug': string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'city-slug': citySlug, 'poi-slug': poiSlug } = await params
  const trail = await getPublishedTrail(citySlug, poiSlug)
  if (!trail) return privatePageMetadata('Randonnée introuvable')
  return privatePageMetadata(`Itinéraire — ${trail.name}`)
}

/**
 * Page plein écran de navigation rando — servie sur accès direct / rafraîchissement de
 * `/guide/<ville>/<cat>/<slug>/start`. En navigation client depuis la liste, c'est la
 * route interceptée `@modal/(.)[poi-slug]/start` qui s'affiche en overlay à la place.
 */
export default async function TrailNavigationStartPage({ params }: Props) {
  const { 'city-slug': citySlug, 'category-slug': categorySlug, 'poi-slug': poiSlug } = await params
  const trail = await getPublishedTrail(citySlug, poiSlug)
  if (!trail) {
    notFound()
    return null
  }

  return (
    <PrivateGuideFrame>
      <TrailNavigationMap
        trail={trail as TrailNavigationData}
        backHref={`/guide/${citySlug}/${categorySlug}`}
        contained
      />
    </PrivateGuideFrame>
  )
}
