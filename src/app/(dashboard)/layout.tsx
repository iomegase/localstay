import type { ReactNode } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Building2, BarChart3 } from 'lucide-react'
import { Separator } from '@/shared/components/ui/separator'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
  { href: '/dashboard/lodgings', label: 'Logements', icon: Building2 },
  { href: '/dashboard/stats', label: 'Statistiques', icon: BarChart3 },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Desktop: top header + sidebar */}
      <header className="hidden md:flex h-14 items-center border-b border-border bg-card px-6 justify-between">
        <span className="font-serif italic text-lg text-foreground">StayLocal</span>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Se déconnecter
          </button>
        </form>
      </header>

      <div className="flex flex-1">
        {/* Sidebar desktop */}
        <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card pt-4">
          <nav className="flex flex-col gap-1 px-3">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto px-3 pb-4">
            <Separator className="mb-4" />
            <p className="text-xs text-muted-foreground px-3">QR Codes · Abonnement</p>
            <p className="text-xs text-muted-foreground px-3 mt-0.5">(disponibles bientôt)</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {/* Mobile header */}
          <header className="md:hidden flex h-14 items-center border-b border-border bg-card px-4 justify-between">
            <span className="font-serif italic text-lg text-foreground">StayLocal</span>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="text-sm text-muted-foreground">
                Déconnexion
              </button>
            </form>
          </header>

          <div className="p-4 md:p-8 pb-24 md:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
