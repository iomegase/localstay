import { redirect } from 'next/navigation'
import { recordQrScanIfPresent } from '@/features/analytics/lib/record-qr-scan'
import { getPrivateGuideData } from '@/features/guide-app/queries/private-guide-data'
import type { GuideRouteMap, GuideView } from '@/features/guide-app/types'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
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

  const menuItems: GuideMenuItem[] = [
    { label: 'Bienvenue', href: '/sejour' },
    { label: 'Coups de cœur', href: '/sejour/coups-de-coeur' },
    { label: "Livret d'accueil", href: '/sejour/logement' },
    { label: 'Vos favoris', href: '/mes-favoris' },
    { label: 'Carte', href: '/map' },
    {
      label: 'Nous contacter',
      href: `/guide/${lodgingContext.citySlug}/contact`,
    },
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
      />
    </PrivateGuideFrame>
  )
}
