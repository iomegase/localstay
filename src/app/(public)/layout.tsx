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
  const lodgingContext = await getActiveLodgingContext()
  const requestHeaders = await headers()
  const isMarketingRoute =
    requestHeaders.get('x-staylocal-marketing-route') === '1'
  const isGuideAppRoute =
    requestHeaders.get('x-staylocal-guide-app-route') === '1'
  const mode = lodgingContext ? 'lodging' : 'anonymous'
  const analytics = (
    <>
      <AnalyticsConsentBanner />
      <GoogleAnalyticsClient />
      <PublicAnalyticsTracker />
      <VercelAnalytics />
      <SpeedInsights />
    </>
  )

  if (!lodgingContext || isMarketingRoute || isGuideAppRoute) {
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
            mode={mode}
            lodgingName={lodgingContext?.lodgingName ?? null}
            ownerName={lodgingContext?.ownerName ?? null}
            citySlug={lodgingContext?.citySlug ?? null}
          />
        </div>
      </header>

      {/* Page content — bottom padding clears the fixed nav bar */}
      <main className="pb-32 pt-6 immersive-main">{children}</main>

      {/* Floating bottom navigation bar — masqué en mode immersif */}
      <PublicBottomNav mode={mode} citySlug={lodgingContext?.citySlug ?? null} />
      {analytics}
    </div>
  )
}
