'use client'

import { BookOpen, House, LifeBuoy, Map } from 'lucide-react'
import type { GuideView } from '@/features/guide-app/types'

export type GuideTabView = 'home' | 'favorites' | 'map' | 'help'

// Spec 054 AC-01-01 : 4 onglets égaux Séjour · Guide · Carte · Aide.
const items: { view: GuideTabView; label: string; icon: typeof House; matches: string[] }[] = [
  {
    view: 'home',
    label: 'Séjour',
    icon: House,
    matches: ['home', 'lodging', 'arrival', 'departure', 'practical', 'rules'],
  },
  { view: 'favorites', label: 'Guide', icon: BookOpen, matches: ['favorites', 'poi'] },
  { view: 'map', label: 'Carte', icon: Map, matches: ['map'] },
  { view: 'help', label: 'Aide', icon: LifeBuoy, matches: ['help', 'contact'] },
]

export function GuideNavigation({
  activeView,
  onNavigate,
}: {
  activeView: GuideView
  onNavigate: (view: GuideTabView) => void
}) {
  return (
    <nav
      aria-label="Navigation du guide"
      className="absolute inset-x-0 bottom-0 z-40 border-t border-[rgba(17,17,17,0.08)] bg-white/[0.94] pb-[env(safe-area-inset-bottom)] backdrop-blur-[14px]"
    >
      <div className="grid h-[86px] grid-cols-4 items-start pt-3">
        {items.map(({ view, label, icon: Icon, matches }) => {
          const active = matches.includes(activeView)
          return (
            <button
              key={view}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => onNavigate(view)}
              className={`flex min-h-[48px] flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                active ? 'text-[#111111]' : 'text-[#9CA3AF]'
              }`}
            >
              <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
