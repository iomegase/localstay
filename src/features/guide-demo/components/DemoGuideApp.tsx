'use client'

import { useRef, useState } from 'react'
import { DemoGuideChrome } from './DemoGuideChrome'
import { DemoHomeView } from './DemoHomeView'
import { DemoLodgingGuideView } from './DemoLodgingGuideView'
import { demoGuideData } from '@/features/guide-demo/demo-content'
import type { DemoGuideView } from '@/features/guide-demo/types'

const PLACEHOLDER_HEADINGS: Record<
  Exclude<DemoGuideView, 'home' | 'lodging'>,
  string
> = {
  favorites: 'Nos coups de cœur',
  map: 'Carte',
  poi: 'Détail',
  lodgings: 'Nos logements',
  'lodging-detail': 'Détail',
  blog: 'Blog',
  'blog-detail': 'Détail',
  contact: 'Votre hôte',
}

export function DemoGuideApp() {
  const [activeView, setActiveView] = useState<DemoGuideView>('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

  function navigate(view: DemoGuideView) {
    setActiveView(view)
    setMenuOpen(false)

    if (mainRef.current) {
      mainRef.current.scrollTop = 0
    }
  }

  return (
    <DemoGuideChrome
      activeView={activeView}
      mainRef={mainRef}
      menuOpen={menuOpen}
      onCloseMenu={() => setMenuOpen(false)}
      onNavigate={navigate}
      onOpenMenu={() => setMenuOpen(true)}
    >
      {activeView === 'home' ? (
        <DemoHomeView
          favoriteCount={demoGuideData.favoritePois.length}
          lodgingName={demoGuideData.lodging.name}
          lodgingCity={demoGuideData.lodging.city}
          onNavigate={navigate}
        />
      ) : activeView === 'lodging' ? (
        <DemoLodgingGuideView lodging={demoGuideData.lodging} />
      ) : (
        <section className="grid min-h-full place-items-center px-6 pb-28 text-center">
          <h1 className="text-4xl font-bold tracking-[-0.04em] text-slate-900">
            {PLACEHOLDER_HEADINGS[activeView]}
          </h1>
        </section>
      )}
    </DemoGuideChrome>
  )
}
