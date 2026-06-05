import Link from 'next/link'
import { PublicMenu } from '@/features/city-guide/components/PublicMenu'
import { PublicBottomNav } from '@/features/city-guide/components/PublicBottomNav'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const lodgingContext = await getActiveLodgingContext()
  const mode = lodgingContext ? 'lodging' : 'anonymous'

  return (
    <div className="max-w-[430px] mx-auto min-h-screen relative border-x border-gray-100 shadow-2xl bg-ivory immersive-container">
      {/* Glassmorphism sticky header — masqué en mode immersif */}
      <header className="sticky top-0 z-[70] flex justify-between items-center px-6 py-5 glass border-b border-gray-50 immersive-hide">
        <Link href="/" className="flex items-center" aria-label="Accueil">
          {/* <img src="/logo.png" alt="MyStay" className="h-5 w-auto" /> */}
          <p className="text-[30px] font-thin text-pine" style={{ fontFamily: 'Lobster, cursive' }}>
            my <span className="text-gold">stay</span>
          </p>
        </Link>
        <PublicMenu
          mode={mode}
          lodgingName={lodgingContext?.lodgingName ?? null}
          ownerName={lodgingContext?.ownerName ?? null}
          citySlug={lodgingContext?.citySlug ?? null}
        />
      </header>

      {/* Page content — bottom padding clears the fixed nav bar */}
      <main className="pb-32 pt-6 immersive-main">{children}</main>

      {/* Floating bottom navigation bar — masqué en mode immersif */}
      <PublicBottomNav mode={mode} citySlug={lodgingContext?.citySlug ?? null} />
    </div>
  )
}
