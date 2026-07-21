import { Home, Info, LogOut, Settings } from 'lucide-react'

const ITEMS = [
  { href: '#bienvenue', label: 'Bienvenue', icon: Home },
  { href: '#infos-pratiques', label: 'Infos pratiques', icon: Info },
  { href: '#bon-a-savoir', label: 'Bon à savoir', icon: Settings },
  { href: '#depart', label: 'Départ', icon: LogOut },
] as const

export function LodgingSectionNav() {
  return (
    <nav
      aria-label="Sections du guide logement"
      className="sticky top-[81px] z-40 -mx-4 flex gap-2 overflow-x-auto border-y border-slate-200/80 bg-[#f7f9fc]/95 px-4 py-3 backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {ITEMS.map(item => {
        const Icon = item.icon
        return (
          <a
            key={item.href}
            href={item.href}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[12px] font-bold text-slate-600 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Icon className="h-4 w-4" strokeWidth={1.8} />
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}
