import Link from 'next/link'
import { Compass, Map, Heart, Home } from 'lucide-react'
import { PublicMenu } from '@/features/city-guide/components/PublicMenu'
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
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-charcoal rounded-full flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">MS</span>
          </div>
          <span className="text-[13px] font-semibold tracking-tighter uppercase text-charcoal">
            MyStay
          </span>
        </Link>
        <PublicMenu
          mode={mode}
          lodgingName={lodgingContext?.lodgingName ?? null}
          citySlug={lodgingContext?.citySlug ?? null}
        />
      </header>

      {/* Page content — bottom padding clears the fixed nav bar */}
      <main className="pb-32 pt-6 immersive-main">{children}</main>

      {/* Floating bottom navigation bar — masqué en mode immersif */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[390px] immersive-hide">
        <div className="glass border border-black/5 rounded-full px-8 py-4 flex justify-between items-center shadow-xl">
          <NavItem icon={<Compass className="w-5 h-5" />} label="Explorer" href="/" active />
          {mode === 'lodging' ? (
            <>
              <NavItem icon={<Home className="w-5 h-5" />} label="Logement" href="/le-logement" />
              <NavItem icon={<Heart className="w-5 h-5" />} label="Favoris" href="/mes-favoris" />
              <NavItem
                icon={<Map className="w-5 h-5" />}
                label="Guide"
                href={lodgingContext ? `/guide/${lodgingContext.citySlug}` : '/'}
              />
            </>
          ) : (
            <>
              <NavItem icon={<Map className="w-5 h-5" />} label="Villes" href="/" />
              <NavItem icon={<Heart className="w-5 h-5" />} label="Favoris" href="/mes-favoris" />
              <NavItem icon={<Home className="w-5 h-5" />} label="Contact" href="/contact" />
            </>
          )}
        </div>
      </nav>
    </div>
  )
}

function NavItem({
  icon,
  label,
  href,
  active = false,
}: {
  icon: React.ReactNode
  label: string
  href: string
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col items-center gap-1 transition-colors ${
        active ? 'text-charcoal' : 'text-gray-300 hover:text-gold'
      }`}
    >
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-widest">
        {label}
      </span>
    </Link>
  )
}
