'use client'

import { Heart, Home, Map, Sparkles } from 'lucide-react'
import type { GuideView } from '@/features/guide-app/types'

const items = [
  { view: 'home' as const, ariaLabel: 'Accueil', label: 'Accueil', icon: Sparkles },
  { view: 'favorites' as const, ariaLabel: 'Coups de cœur', label: null, icon: Heart, pink: true },
  { view: 'lodging' as const, ariaLabel: 'Guide logement', label: 'Guide', icon: Home },
  { view: 'map' as const, ariaLabel: 'Carte', label: 'Carte', icon: Map },
]

export function GuideNavigation({
  activeView,
  onNavigate,
}: {
  activeView: GuideView
  onNavigate: (view: GuideView) => void
}) {
  return (
    <nav
      aria-label="Navigation du guide"
      className="absolute inset-x-3 bottom-3 z-40 rounded-full border border-white/70 bg-white/92 p-1.5 shadow-[0_16px_36px_rgba(15,23,42,0.18)] backdrop-blur-xl"
    >
      <div className="grid grid-cols-4 gap-1">
        {items.map(({ view, ariaLabel, label, icon: Icon, pink }) => {
          const active =
            activeView === view ||
            (view === 'lodging' &&
              ['arrival', 'departure', 'practical'].includes(activeView))

          return (
            <button
              key={view}
              type="button"
              aria-label={ariaLabel}
              aria-current={active ? 'page' : undefined}
              onClick={() => onNavigate(view)}
              className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[8px] font-bold leading-tight transition ${
                active
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`h-[17px] w-[17px] ${
                  pink && !active ? 'text-pink-600' : ''
                }`}
              />
              {label && <span>{label}</span>}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
