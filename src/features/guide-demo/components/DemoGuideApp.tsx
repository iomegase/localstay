'use client'

import { useRef, useState } from 'react'
import { DemoGuideChrome } from './DemoGuideChrome'
import {
  DemoBlogDetailView,
  DemoBlogView,
  DemoContactView,
  DemoLodgingDetailView,
  DemoLodgingsView,
} from './DemoEditorialViews'
import { DemoFavoritesView } from './DemoFavoritesView'
import { DemoHomeView } from './DemoHomeView'
import { DemoLodgingGuideView } from './DemoLodgingGuideView'
import { DemoMapView } from './DemoMapView'
import { DemoPoiDetailView } from './DemoPoiDetailView'
import { demoGuideData } from '@/features/guide-demo/demo-content'
import { demoPois } from '@/features/guide-demo/demo-pois'
import type {
  DemoBlogPost,
  DemoGuideView,
  DemoLodgingCard,
  DemoPoi,
} from '@/features/guide-demo/types'

type DemoEditorialSelections = {
  selectedLodging: DemoLodgingCard | null
  selectedPost: DemoBlogPost | null
}

export function getEditorialSelectionsForView(
  view: DemoGuideView,
  selections: DemoEditorialSelections,
): DemoEditorialSelections {
  const keepsLodging = view === 'lodgings' || view === 'lodging-detail'
  const keepsPost = view === 'blog' || view === 'blog-detail'

  return {
    selectedLodging: keepsLodging ? selections.selectedLodging : null,
    selectedPost: keepsPost ? selections.selectedPost : null,
  }
}

export function DemoGuideApp() {
  const [activeView, setActiveView] = useState<DemoGuideView>('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedPoi, setSelectedPoi] = useState<DemoPoi | null>(null)
  const [selectedMapPoi, setSelectedMapPoi] = useState<DemoPoi | null>(null)
  const [selectedLodging, setSelectedLodging] = useState<DemoLodgingCard | null>(null)
  const [selectedPost, setSelectedPost] = useState<DemoBlogPost | null>(null)
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null)
  const [detailOrigin, setDetailOrigin] = useState<'favorites' | 'map'>('favorites')
  const mainRef = useRef<HTMLElement>(null)

  function navigate(
    view: DemoGuideView,
    editorialSelections: DemoEditorialSelections = {
      selectedLodging,
      selectedPost,
    },
  ) {
    const nextSelections = getEditorialSelectionsForView(view, editorialSelections)

    setActiveView(view)
    setMenuOpen(false)
    setSelectedLodging(nextSelections.selectedLodging)
    setSelectedPost(nextSelections.selectedPost)

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

  function openLodging(lodging: DemoLodgingCard) {
    navigate('lodging-detail', { selectedLodging: lodging, selectedPost })
  }

  function openPost(post: DemoBlogPost) {
    navigate('blog-detail', { selectedLodging, selectedPost: post })
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
          selectedCategorySlug={selectedCategorySlug}
          onFilter={setSelectedCategorySlug}
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
      ) : activeView === 'lodgings' ? (
        <DemoLodgingsView
          lodgings={demoGuideData.lodgingCards}
          onOpenLodging={openLodging}
        />
      ) : activeView === 'lodging-detail' && selectedLodging ? (
        <DemoLodgingDetailView
          lodging={selectedLodging}
          onBack={() => navigate('lodgings')}
        />
      ) : activeView === 'blog' ? (
        <DemoBlogView posts={demoGuideData.blogPosts} onOpenPost={openPost} />
      ) : activeView === 'blog-detail' && selectedPost ? (
        <DemoBlogDetailView post={selectedPost} onBack={() => navigate('blog')} />
      ) : activeView === 'contact' ? (
        <DemoContactView contact={demoGuideData.contact} />
      ) : null}
    </DemoGuideChrome>
  )
}
