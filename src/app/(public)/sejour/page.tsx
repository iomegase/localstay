import { redirect } from 'next/navigation'
import { GuideApp } from '@/features/guide-app/components/GuideApp'
import type { GuideMenuItem } from '@/features/guide-app/components/GuideMenuOverlay'
import { getPrivateGuideData } from '@/features/guide-app/queries/private-guide-data'
import type { GuideRouteMap } from '@/features/guide-app/types'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'

const PRIVATE_GUIDE_ROUTES: GuideRouteMap = {
  home: '/sejour',
  favorites: '/nos-recommandations',
  lodging: '/le-logement',
  arrival: '/le-logement#bienvenue',
  practical: '/le-logement#infos-pratiques',
  departure: '/le-logement#depart',
  map: '/map',
}

export default async function SejourPage() {
  const lodgingContext = await getActiveLodgingContext()
  if (!lodgingContext) redirect('/acces-reserve')

  const guideData = await getPrivateGuideData(lodgingContext.lodgingId)
  if (!guideData) redirect('/acces-reserve')

  const menuItems: GuideMenuItem[] = [
    { label: 'Bienvenue', href: '/sejour' },
    { label: 'Coups de cœur', href: '/nos-recommandations' },
    { label: "Livret d'accueil", href: '/le-logement' },
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
        routes={PRIVATE_GUIDE_ROUTES}
        menuItems={menuItems}
      />
    </div>
  )
}
