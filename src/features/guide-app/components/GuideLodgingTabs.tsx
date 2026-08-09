import { HousePlug, KeyRound, LogOut, Wifi } from 'lucide-react'
import type { GuideView } from '@/features/guide-app/types'

type LodgingSubView = Extract<GuideView, 'arrival' | 'practical' | 'rules' | 'departure'>

const TABS: { view: LodgingSubView; label: string; icon: typeof KeyRound }[] = [
  { view: 'arrival', label: 'Accès', icon: KeyRound },
  { view: 'practical', label: 'Infos', icon: Wifi },
  { view: 'rules', label: 'Équipements', icon: HousePlug },
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
      className="sticky top-0 z-10 -mx-4 grid grid-cols-4 gap-1.5 bg-white px-4 pb-2 pt-1"
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
            className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-semibold shadow-md outline-none transition-shadow focus:outline-none focus-visible:outline-none ${
              active
                ? 'border-none bg-pink-600 text-white'
                : 'border border-slate-50 bg-white text-slate-500 hover:text-slate-700 hover:shadow-lg'
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
