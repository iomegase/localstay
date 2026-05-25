import type { ReactNode } from 'react'
import Link from 'next/link'
import { BarChart3, Building2, LayoutDashboard, MapPinPlus, Mountain, Radar, Tags, Users } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Vue globale', icon: LayoutDashboard },
  { href: '/admin/merchant-claims', label: 'Revendications', icon: BarChart3 },
  { href: '/admin/cities', label: 'Villes', icon: Building2 },
  { href: '/admin/taxonomy', label: 'Taxonomie', icon: Tags },
  { href: '/admin/poi-acquisition', label: 'Acquisition POI', icon: Radar },
  { href: '/admin/trails', label: 'Randonnées', icon: Mountain },
  { href: '/admin/pois/new', label: 'Créer POI', icon: MapPinPlus },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
]

export default function AdminPathLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-white/10 bg-slate-900/80 p-6 md:block">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">StayLocal</p>
            <p className="mt-2 text-2xl font-semibold">Super-Admin</p>
          </div>
          <nav className="mt-8 space-y-2">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                {label === 'Revendications' && (
                  <span aria-label="Badge revendications pending" className="h-2 w-2 rounded-full bg-amber-400" />
                )}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <header className="border-b border-white/10 bg-slate-50/90 px-5 py-4 md:hidden">
            <p className="text-lg font-semibold">Super-Admin</p>
            <nav className="mt-3 flex gap-3 overflow-x-auto text-sm text-slate-300">
              {NAV_ITEMS.map(item => (
                <Link key={item.href} href={item.href} className="whitespace-nowrap">
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>
          <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
