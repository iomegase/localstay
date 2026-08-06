import { redirect } from 'next/navigation'
import { recordQrScanIfPresent } from '@/features/analytics/lib/record-qr-scan'
import { getPrivateGuideData } from '@/features/guide-app/queries/private-guide-data'
import type {
  GuideBlogPost,
  GuideLodgingCard,
  GuideRouteMap,
  GuideView,
} from '@/features/guide-app/types'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { listPublishedLodgings } from '@/features/lodging-showcase/queries/public-lodgings'
import { getPublishedBlogArticles } from '@/features/blog/queries/public-blog'
import { blogCategoryLabel } from '@/features/blog/lib/category-label'
import { GuideApp } from './GuideApp'
import type { GuideMenuItem } from './GuideMenuOverlay'
import { PrivateGuideFrame } from './PrivateGuideFrame'

export const PRIVATE_GUIDE_ROUTES: GuideRouteMap = {
  home: '/sejour',
  favorites: '/sejour/coups-de-coeur',
  lodging: '/sejour/logement',
  arrival: '/sejour/logement/arrivee',
  practical: '/sejour/logement/informations-pratiques',
  rules: '/sejour/logement/consignes',
  departure: '/sejour/logement/depart',
}

type PrivateGuidePageProps = {
  initialView?: GuideView
  qrLodgingId?: string | null
}

export async function PrivateGuidePage({
  initialView = 'home',
  qrLodgingId,
}: PrivateGuidePageProps = {}) {
  const lodgingContext = await getActiveLodgingContext()
  if (!lodgingContext) redirect('/acces-reserve')

  const guideData = await getPrivateGuideData(lodgingContext.lodgingId)
  if (!guideData) redirect('/acces-reserve')

  if (qrLodgingId !== undefined) {
    void recordQrScanIfPresent(qrLodgingId)
  }

  // Données récupérées côté serveur et injectées dans l'app : le guest confiné
  // les consulte DANS le cadre, sans lien vers le site public (sinon il perd
  // l'accès à son guide via le confinement du proxy).
  const [lodgingsData, blogData] = await Promise.all([
    listPublishedLodgings(),
    getPublishedBlogArticles(lodgingContext.citySlug),
  ])

  const lodgings: GuideLodgingCard[] = lodgingsData.map(item => ({
    id: item.id,
    slug: item.slug,
    citySlug: item.city_slug,
    title: item.title,
    cityName: item.city_name,
    propertyType: item.property_type,
    coverPhotoUrl: item.cover_photo_url,
    shortDescription: item.short_description,
    maxGuests: item.max_guests,
    bedroomCount: item.bedroom_count,
    surfaceM2: item.surface_m2,
    publicAreaLabel: item.public_area_label,
    amenities: item.amenities,
  }))

  const blogPosts: GuideBlogPost[] = (blogData?.items ?? []).map(article => ({
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    categoryLabel: blogCategoryLabel(article.category),
    coverUrl: article.cover?.url ?? null,
    cityName: article.city?.name ?? null,
  }))

  // Vues internes (aucun lien sortant) ; contact reste guide-scopé (autorisé).
  const menuItems: GuideMenuItem[] = [
    { label: 'Tous nos logements', view: 'lodgings' },
    { label: 'Blog', view: 'blog' },
    { label: 'Nous contacter', view: 'contact' },
  ]

  return (
    <PrivateGuideFrame>
      <GuideApp
        mode="private"
        lodging={guideData.lodging}
        pois={guideData.pois}
        citySlug={lodgingContext.citySlug}
        initialView={initialView}
        routes={PRIVATE_GUIDE_ROUTES}
        menuItems={menuItems}
        lodgings={lodgings}
        blogPosts={blogPosts}
        contact={{
          lodgingId: lodgingContext.lodgingId,
          lodgingName: lodgingContext.lodgingName,
          cityName: lodgingContext.cityName,
        }}
      />
    </PrivateGuideFrame>
  )
}
