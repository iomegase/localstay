import { redirect } from 'next/navigation'
import { recordQrScanIfPresent } from '@/features/analytics/lib/record-qr-scan'
import { getPrivateGuideData } from '@/features/guide-app/queries/private-guide-data'
import type { GuideRouteMap, GuideView } from '@/features/guide-app/types'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { GuideApp } from './GuideApp'
import type { GuideMenuItem } from './GuideMenuOverlay'

export const PRIVATE_GUIDE_ROUTES: GuideRouteMap = {
  home: '/sejour',
  favorites: '/sejour/coups-de-coeur',
  lodging: '/sejour/logement',
  arrival: '/sejour/logement/arrivee',
  practical: '/sejour/logement/informations-pratiques',
  departure: '/le-logement#depart',
  map: '/map',
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
    <div
      data-testid="private-guide-shell"
      className="mx-auto h-[100dvh] w-full max-w-[430px] overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.16)]"
    >
      <GuideApp
        mode="private"
        lodging={guideData.lodging}
        pois={guideData.pois}
        initialView={initialView}
        routes={PRIVATE_GUIDE_ROUTES}
        menuItems={menuItems}
      />
    </div>
  )
}
