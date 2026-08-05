import { KeyRound, LogOut, ScrollText, Wifi } from 'lucide-react'
import type { GuideView } from '@/features/guide-app/types'

type LodgingSubView = Extract<GuideView, 'arrival' | 'practical' | 'rules' | 'departure'>

const TABS: { view: LodgingSubView; label: string; icon: typeof KeyRound }[] = [
  { view: 'arrival', label: 'Accès', icon: KeyRound },
  { view: 'practical', label: 'Infos', icon: Wifi },
  { view: 'rules', label: 'Consignes', icon: ScrollText },
  { view: 'departure', label: 'Départ', icon: LogOut },
]

/**
 * Mini-menu collant en haut des 4 sous-pages du livret. Permet de sauter d'une
 * catégorie à l'autre sans repasser par le hub « Guide logement ».
 */
export function GuideLodgingTabs({
  view,
  onNavigate,
}: {
  view: LodgingSubView
  onNavigate: (view: GuideView) => void
}) {
  return (
    <nav
      aria-label="Catégories du livret"
      className="sticky top-0 z-10 -mx-4 grid grid-cols-4 gap-1.5 bg-white/95 px-4 pb-2 pt-1 backdrop-blur"
    >
      {TABS.map(tab => {
        const active = tab.view === view
        const Icon = tab.icon
        return (
          <button
            key={tab.view}
            type="button"
            onClick={() => onNavigate(tab.view)}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-semibold transition-colors ${
              active
                ? 'bg-pink-600 text-white shadow-[0_8px_20px_rgba(219,39,119,0.22)]'
                : 'bg-slate-100 text-slate-500 active:bg-slate-200'
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
