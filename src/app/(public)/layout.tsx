import Link from 'next/link'
import Image from 'next/image'
import { Analytics as VercelAnalytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
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
  const mode = lodgingContext ? 'lodging' : 'anonymous'

  return (
    <div className="max-w-[430px] mx-auto min-h-[100dvh] relative sm:border-x sm:shadow-2xl bg-white immersive-container">
      {/* Glassmorphism sticky header — masqué en mode immersif */}
      <header
        data-testid="public-header"
        className="sticky top-0 z-[70] flex items-center border-b border-white/40 bg-white/70 px-6 py-5 backdrop-blur-xl immersive-hide"
      >
        {/* <Link href="/" className="flex items-center" aria-label="Accueil">
          <Image
            src="/logo.png"
            alt="my stay"
            width={695}
            height={130}
            priority
            className="h-7 w-auto"
          />
        </Link> */}
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
      <AnalyticsConsentBanner />
      <GoogleAnalyticsClient />
      <PublicAnalyticsTracker />
      <VercelAnalytics />
      <SpeedInsights />
    </div>
  )
}
