import { Analytics as VercelAnalytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { headers } from 'next/headers'
import { PublicMenu } from '@/features/city-guide/components/PublicMenu'
import { PublicBottomNav } from '@/features/city-guide/components/PublicBottomNav'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { AnalyticsConsentBanner } from '@/features/admin-analytics/components/AnalyticsConsentBanner'
import { PublicAnalyticsTracker } from '@/features/admin-analytics/components/PublicAnalyticsTracker'
import { GoogleAnalyticsClient } from '@/features/admin-analytics/components/GoogleAnalyticsClient'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const requestHeaders = await headers()
  const isMarketingRoute =
    requestHeaders.get('x-staylocal-marketing-route') === '1'
  const isGuideAppRoute =
    requestHeaders.get('x-staylocal-guide-app-route') === '1'
  const analytics = (
    <>
      <AnalyticsConsentBanner />
      <GoogleAnalyticsClient />
      <PublicAnalyticsTracker />
      <VercelAnalytics />
      <SpeedInsights />
    </>
  )

  // Ces signaux sont produits par notre proxy depuis le pathname de la requête.
  // Une page marketing (dont `/decouvrir`) ne doit jamais lire le cookie séjour
  // ni charger Lodging/Owner, même si le navigateur porte encore un ancien cookie.
  if (isMarketingRoute || isGuideAppRoute) {
    return (
      <>
        {children}
        {analytics}
      </>
    )
  }

  const lodgingContext = await getActiveLodgingContext()
  if (!lodgingContext) {
    return (
      <>
        {children}
        {analytics}
      </>
    )
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] relative bg-white immersive-container">
      {/* Glassmorphism sticky header — masqué en mode immersif */}
      <header
        data-testid="public-header"
        className="sticky top-0 z-[70] flex items-center border-b border-white/40 bg-white/70 px-6 py-5 backdrop-blur-xl immersive-hide"
      >
        <div data-testid="public-header-menu-slot" className="ml-auto">
          <PublicMenu
            mode="lodging"
            lodgingName={lodgingContext.lodgingName}
            ownerName={lodgingContext.ownerName}
            citySlug={lodgingContext.citySlug}
          />
        </div>
      </header>

      {/* Page content — bottom padding clears the fixed nav bar */}
      <main className="pb-32 pt-6 immersive-main">{children}</main>

      {/* Floating bottom navigation bar — masqué en mode immersif */}
      <PublicBottomNav mode="lodging" citySlug={lodgingContext.citySlug} />
      {analytics}
    </div>
  )
}
