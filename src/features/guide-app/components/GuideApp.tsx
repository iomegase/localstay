'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { GuideFavoritesPage } from './GuideFavoritesPage'
import { GuideHeader } from './GuideHeader'
import { GuideHome } from './GuideHome'
import { GuideLodgingViews } from './GuideLodgingViews'
import { GuideNavigation } from './GuideNavigation'
import { GuidePoiDetails } from './GuidePoiDetails'
import type {
  GuideLodging,
  GuideMode,
  GuidePoi,
  GuideView,
} from '@/features/guide-app/types'

const GuideMapView = dynamic(
  () => import('./GuideMapView').then(module => module.GuideMapView),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full min-h-[460px] place-items-center bg-slate-100 text-xs text-slate-500">
        Chargement de la carte…
      </div>
    ),
  },
)

export function GuideApp({
  mode,
  lodging,
  pois,
  initialView = 'home',
}: {
  mode: GuideMode
  lodging: GuideLodging
  pois: GuidePoi[]
  initialView?: GuideView
}) {
  const [activeView, setActiveView] = useState<GuideView>(initialView)
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null)
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(
    null,
  )

  const selectedPoi = useMemo(
    () => pois.find(poi => poi.id === selectedPoiId) ?? null,
    [pois, selectedPoiId],
  )

  function openPoi(poi: GuidePoi) {
    setSelectedPoiId(poi.id)
    setActiveView('poi')
  }

  function showOnMap(poi: GuidePoi) {
    setSelectedPoiId(poi.id)
    setActiveView('map')
  }

  function navigate(view: GuideView) {
    if (view !== 'poi' && view !== 'map') {
      setSelectedPoiId(null)
    }
    setActiveView(view)
  }

  return (
    <div
      data-guide-mode={mode}
      className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-white text-slate-900"
    >
      {activeView !== 'poi' && (
        <GuideHeader
          city={lodging.city}
          onOpenHome={() => navigate('home')}
        />
      )}

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {activeView === 'home' && (
          <GuideHome
            lodging={lodging}
            pois={pois}
            onNavigate={navigate}
            onSelectPoi={openPoi}
          />
        )}
        {['lodging', 'arrival', 'departure', 'practical'].includes(activeView) && (
          <GuideLodgingViews
            view={
              activeView as Extract<
                GuideView,
                'lodging' | 'arrival' | 'departure' | 'practical'
              >
            }
            lodging={lodging}
            onNavigate={navigate}
          />
        )}
        {activeView === 'favorites' && (
          <GuideFavoritesPage
            pois={pois}
            selectedCategorySlug={selectedCategorySlug}
            onFilter={setSelectedCategorySlug}
            onSelectPoi={openPoi}
            onShowOnMap={showOnMap}
          />
        )}
        {activeView === 'poi' && selectedPoi && (
          <GuidePoiDetails
            mode={mode}
            poi={selectedPoi}
            lodging={lodging}
            onBack={() => navigate('favorites')}
            onShowOnMap={showOnMap}
          />
        )}
        {activeView === 'map' && (
          <GuideMapView
            lodging={lodging}
            pois={pois}
            selectedPoiId={selectedPoiId}
            selectedCategorySlug={selectedCategorySlug}
            onFilter={setSelectedCategorySlug}
            onSelectPoi={poi => setSelectedPoiId(poi.id)}
            onOpenPoi={openPoi}
          />
        )}
      </main>

      {activeView !== 'poi' && (
        <GuideNavigation activeView={activeView} onNavigate={navigate} />
      )}
    </div>
  )
}
