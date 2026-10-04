'use client'

import { useState } from 'react'
import { Heart, House, Settings, Map } from 'lucide-react'
import type { GuideView } from '@/features/guide-app/types'
import { useGuideMessages } from '@/features/guide-i18n/components/GuideI18nContext'

export type GuideTabView = 'home' | 'favorites' | 'map' | 'help'

// Spec 054 AC-01-01 (PO 2026-10-03) : navigation fluide, palette neutre.
const items: { view: GuideTabView; icon: typeof House; matches: string[] }[] = [
  {
    view: 'home',
    icon: House,
    matches: ['home', 'lodging', 'arrival', 'departure', 'rules', 'transport'],
  },
  { view: 'favorites', icon: Heart, matches: ['favorites', 'poi'] },
  { view: 'map', icon: Map, matches: ['map'] },
  { view: 'help', icon: Settings, matches: ['help', 'contact'] },
]

export function GuideNavigation({
  activeView,
  onNavigate,
}: {
  activeView: GuideView
  onNavigate: (view: GuideTabView) => void
}) {
  const m = useGuideMessages()
  const activeIndex = items.findIndex(item => item.matches.includes(activeView))
  const [selection, setSelection] = useState({ view: activeView, index: activeIndex })
  if (selection.view !== activeView) {
    setSelection({ view: activeView, index: activeIndex })
  }
  const indicatorIndex = selection.view === activeView ? selection.index : activeIndex
  const positions = ['translate-x-0', 'translate-x-full', 'translate-x-[200%]', 'translate-x-[300%]']

  return (
    <nav
      aria-label={m.nav.label}
      className="absolute inset-x-0 bottom-0 z-40 bg-white/[0.96] pb-[max(4px,env(safe-area-inset-bottom))] shadow-[0_-8px_28px_rgba(15,23,42,0.10)] backdrop-blur-[14px]"
    >
      <div className="px-3 pt-1">
        <div className="relative isolate grid h-12 grid-cols-4 items-stretch">
          {indicatorIndex >= 0 && (
            <div
              aria-hidden="true"
              data-testid="guide-navigation-indicator"
              className={`pointer-events-none absolute inset-y-0 left-0 -z-10 w-1/4 px-1 motion-safe:transition-transform motion-safe:[transition-duration:350ms] motion-safe:[transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${positions[indicatorIndex]}`}
            >
              <div
                key={indicatorIndex}
                className="h-full w-full rounded-full bg-slate-100 motion-safe:animate-guide-nav-droplet"
              />
            </div>
          )}
          {items.map(({ view, icon: Icon, matches }, index) => {
            const label = m.nav[view]
            const active = matches.includes(activeView)
            return (
              <button
                key={view}
                type="button"
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                onClick={() => {
                  setSelection({ view: activeView, index })
                  onNavigate(view)
                }}
                className={`flex min-h-[48px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-semibold tracking-[-0.025em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 ${
                  active ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                <span className="flex h-7 shrink-0 items-center justify-center" aria-hidden="true">
                  <Icon
                    className={`${view === 'favorites' ? 'h-7 w-7 fill-none text-pink-600' : 'h-6 w-6'}`}
                    strokeWidth={1}
                    aria-hidden="true"
                  />
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
