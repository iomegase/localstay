'use client'

import { useRef, useState } from 'react'
import { DemoGuideChrome } from './DemoGuideChrome'
import { DemoFavoritesView } from './DemoFavoritesView'
import { DemoHomeView } from './DemoHomeView'
import { DemoLodgingGuideView } from './DemoLodgingGuideView'
import { DemoMapView } from './DemoMapView'
import { DemoPoiDetailView } from './DemoPoiDetailView'
import { demoGuideData } from '@/features/guide-demo/demo-content'
import { demoPois } from '@/features/guide-demo/demo-pois'
import type { DemoGuideView, DemoPoi } from '@/features/guide-demo/types'

const PLACEHOLDER_HEADINGS: Record<
  Exclude<DemoGuideView, 'home' | 'lodging' | 'favorites' | 'map' | 'poi'>,
  string
> = {
  lodgings: 'Nos logements',
  'lodging-detail': 'Détail',
  blog: 'Blog',
  'blog-detail': 'Détail',
  contact: 'Votre hôte',
}

export function DemoGuideApp() {
  const [activeView, setActiveView] = useState<DemoGuideView>('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedPoi, setSelectedPoi] = useState<DemoPoi | null>(null)
  const [selectedMapPoi, setSelectedMapPoi] = useState<DemoPoi | null>(null)
  const [detailOrigin, setDetailOrigin] = useState<'favorites' | 'map'>('favorites')
  const mainRef = useRef<HTMLElement>(null)

  function navigate(view: DemoGuideView) {
    setActiveView(view)
    setMenuOpen(false)

    if (mainRef.current) {
      mainRef.current.scrollTop = 0
    }
  }

  function openPoi(poi: DemoPoi, origin: 'favorites' | 'map') {
    setSelectedPoi(poi)
    setDetailOrigin(origin)
    navigate('poi')
  }

  function showOnMap(poi: DemoPoi) {
    setSelectedMapPoi(poi)
    navigate('map')
  }

  function returnFromPoi() {
    navigate(detailOrigin)
  }

  return (
    <DemoGuideChrome
      activeView={activeView}
      mainRef={mainRef}
      menuOpen={menuOpen}
      onCloseMenu={() => setMenuOpen(false)}
      onNavigate={navigate}
      onOpenMenu={() => setMenuOpen(true)}
      immersive={activeView === 'poi'}
    >
      {activeView === 'home' ? (
        <DemoHomeView
          favoriteCount={demoPois.length}
          lodgingName={demoGuideData.lodging.name}
          lodgingCity={demoGuideData.lodging.city}
          onNavigate={navigate}
        />
      ) : activeView === 'lodging' ? (
        <DemoLodgingGuideView lodging={demoGuideData.lodging} />
      ) : activeView === 'favorites' ? (
        <DemoFavoritesView
          pois={demoPois}
          onOpenPoi={poi => openPoi(poi, 'favorites')}
          onShowOnMap={showOnMap}
        />
      ) : activeView === 'map' ? (
        <DemoMapView
          pois={demoPois}
          selectedPoi={selectedMapPoi}
          onDeselectPoi={() => setSelectedMapPoi(null)}
          onOpenPoi={poi => openPoi(poi, 'map')}
          onSelectPoi={setSelectedMapPoi}
        />
      ) : activeView === 'poi' && selectedPoi ? (
        <DemoPoiDetailView
          lodging={demoGuideData.lodging}
          poi={selectedPoi}
          returnLabel={
            detailOrigin === 'favorites'
              ? 'Retour aux coups de cœur'
              : 'Retour à la carte'
          }
          onBack={returnFromPoi}
          onShowOnMap={showOnMap}
        />
      ) : activeView === 'poi' ? null : (
        <section className="grid min-h-full place-items-center px-6 pb-28 text-center">
          <h1 className="text-4xl font-bold tracking-[-0.04em] text-slate-900">
            {PLACEHOLDER_HEADINGS[activeView]}
          </h1>
        </section>
      )}
    </DemoGuideChrome>
  )
}
