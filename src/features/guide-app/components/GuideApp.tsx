'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { GuideFavoritesPage } from './GuideFavoritesPage'
import { GuideHeader } from './GuideHeader'
import { GuideLodgingsView } from './GuideLodgingsView'
import { GuideBlogView } from './GuideBlogView'
import { GuideLodgingDetailView } from './GuideLodgingDetailView'
import { GuideBlogDetailView } from './GuideBlogDetailView'
import { GuideContactView, type GuideContactInfo } from './GuideContactView'
import { GuideMenuOverlay } from './GuideMenuOverlay'
import type { GuideMenuItem } from './GuideMenuOverlay'
import { GuideNavigation } from './GuideNavigation'
import { GuidePoiDetails } from './GuidePoiDetails'
import { GuideArrivalFlow } from './stay/GuideArrivalFlow'
import { GuideDepartureView } from './stay/GuideDepartureView'
import { GuideHelpView } from './stay/GuideHelpView'
import { GuideInstallCard } from '@/features/guide-pwa/components/GuideInstallCard'
import { GuideHouseGuide } from './stay/GuideHouseGuide'
import { GuideStayHome } from './stay/GuideStayHome'
import { GuideWifiSheet } from './stay/GuideWifiSheet'
import { useStayProgress } from './stay/useStayProgress'
import { useTravelTimes } from './stay/useTravelTimes'
import { GuideTransportEntry } from '@/features/transport/components/GuideTransportEntry'
import { GuideTransportView } from '@/features/transport/components/GuideTransportView'
import { departureTasks } from '@/features/guide-app/lib/fixed-lodging-content'
import type {
  GuideBlogDetail,
  GuideBlogPost,
  GuideLodging,
  GuideLodgingCard,
  GuideLodgingDetail,
  GuideMode,
  GuidePoi,
  GuideRouteMap,
  GuideView,
} from '@/features/guide-app/types'
import { useGuideViewNavigation } from '../hooks/useGuideViewNavigation'
import { isGuideMenuEnabled } from '@/features/guide-app/lib/guide-menu-visibility'

const loadGuideMapView = () => import('./GuideMapView').then(module => module.GuideMapView)

const GuideMapView = dynamic(
  loadGuideMapView,
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full min-h-[460px] place-items-center bg-slate-100 text-xs text-slate-500">
        Chargement de la carte…
      </div>
    ),
  },
)

type GuideAppProps = {
  mode: GuideMode
  lodging: GuideLodging
  pois: GuidePoi[]
  transportPois?: GuidePoi[]
  citySlug?: string
  initialView?: GuideView
  routes?: GuideRouteMap
  menuItems?: GuideMenuItem[]
  lodgings?: GuideLodgingCard[]
  blogPosts?: GuideBlogPost[]
  contact?: GuideContactInfo
  menuEnabled?: boolean
}

export function GuideApp(props: GuideAppProps) {
  if (props.routes) {
    return <RoutedGuideApp {...props} routes={props.routes} />
  }

  return <GuideAppShell {...props} />
}

function RoutedGuideApp({ routes, ...props }: GuideAppProps & {
  routes: GuideRouteMap
}) {
  const router = useRouter()
  const citySlug = props.mode === 'private' ? props.citySlug : undefined

  return (
    <GuideAppShell
      {...props}
      routes={routes}
      onStartTrail={citySlug
        ? poi => router.push(
            `/guide/${poi.citySlug ?? citySlug}/rando/${poi.slug}/start`,
          )
        : undefined}
    />
  )
}

function GuideAppShell({
  mode,
  lodging,
  pois,
  transportPois = [],
  initialView = 'home',
  routes,
  menuItems,
  lodgings,
  blogPosts,
  contact,
  menuEnabled = isGuideMenuEnabled(),
  onStartTrail,
}: GuideAppProps & {
  onStartTrail?: (poi: GuidePoi) => void
}) {
  const { activeView, setActiveView, navigate: navigateView } = useGuideViewNavigation(initialView, routes)
  const scrollRef = useRef<HTMLElement>(null)
  // Spec 054 AC-01-12 : charger le JS en avance, sans monter la carte.
  useEffect(() => {
    const preload = () => { void loadGuideMapView().catch(() => undefined) }
    if (typeof window.requestIdleCallback === 'function') {
      const idle = window.requestIdleCallback(preload, { timeout: 1000 })
      return () => window.cancelIdleCallback(idle)
    }
    const timer = window.setTimeout(preload, 200)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [activeView])

  const [wifiOpen, setWifiOpen] = useState(false)
  const stay = useStayProgress(lodging.id, { persist: mode === 'private' })
  const travelTimes = useTravelTimes(mode === 'private' && lodging.locationPrecise && pois.length > 0)
  const departureDone = departureTasks(lodging.departureInstructions).filter((_, index) =>
    stay.checked.has(index),
  ).length
  // Écrans secondaires plein écran (spec 054) : sans en-tête ni barre d'onglets.
  const fullScreen = ['poi', 'arrival', 'departure', 'rules', 'transport'].includes(activeView)

  // Spec 054 US-03 : la démo n'émet aucun événement (AC-06-01).
  async function sendStayEvent(type: 'arrived' | 'departed') {
    if (mode === 'private') {
      const response = await fetch('/api/guide/stay-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      if (!response.ok) throw new Error('stay_event_failed')
    }
    if (type === 'arrived') stay.markArrived()
    else stay.markDeparted()
  }
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null)
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(
    null,
  )
  const [poiOrigin, setPoiOrigin] = useState<GuideView>('favorites')
  const [menuOpen, setMenuOpen] = useState(false)
  const [lodgingDetail, setLodgingDetail] = useState<GuideLodgingDetail | null>(null)
  const [blogDetail, setBlogDetail] = useState<GuideBlogDetail | null>(null)

  // Détail chargé à la demande via l'API interne (confinement : JSON, jamais de
  // sortie vers le site public). `null` pendant le chargement.
  async function openLodgingDetail(card: GuideLodgingCard) {
    setLodgingDetail(null)
    setActiveView('lodging-detail')
    try {
      const res = await fetch(
        `/api/internal/guide/lodging/${card.slug}?city=${encodeURIComponent(card.citySlug)}`,
      )
      if (res.ok) setLodgingDetail(await res.json())
    } catch {
      /* garde l'état de chargement ; retour possible via le bouton */
    }
  }

  async function openBlogDetail(post: GuideBlogPost) {
    setBlogDetail(null)
    setActiveView('blog-detail')
    try {
      const res = await fetch(`/api/internal/guide/blog/${post.slug}`)
      if (res.ok) setBlogDetail(await res.json())
    } catch {
      /* garde l'état de chargement */
    }
  }

  const selectedPoi = useMemo(
    () => [...pois, ...transportPois].find(poi => poi.id === selectedPoiId) ?? null,
    [pois, transportPois, selectedPoiId],
  )

  function openPoi(poi: GuidePoi) {
    // Mémorise la vue d'origine pour y revenir en fermant la fiche (carte ou favoris).
    if (activeView !== 'poi') setPoiOrigin(activeView)
    setSelectedPoiId(poi.id)
    setActiveView('poi')
  }

  function showOnMap(poi: GuidePoi) {
    setSelectedPoiId(poi.id)
    setActiveView('map')
  }

  // Changer de catégorie efface la sélection (donc le tracé sur la carte).
  function filterCategory(slug: string | null) {
    setSelectedPoiId(null)
    setSelectedCategorySlug(slug)
  }

  function navigate(view: GuideView) {
    if (view !== 'poi' && view !== 'map') {
      setSelectedPoiId(null)
    }
    navigateView(view)
  }

  // Depuis la barre du bas : ouvrir la carte réinitialise sur la catégorie « Tous ».
  function navigateFromTab(view: GuideView) {
    if (view === 'map') {
      setSelectedPoiId(null)
      setSelectedCategorySlug(null)
    }
    // Re-tap sur Favoris déjà actif : réinitialise « Tous » et rafraîchit la page.
    if (view === 'favorites' && activeView === 'favorites') {
      setSelectedPoiId(null)
      setSelectedCategorySlug(null)
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
    navigate(view)
  }

  return (
    <div
      data-guide-mode={mode}
      className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-white text-slate-900"
    >
      {!fullScreen && (
        <GuideHeader
          city={lodging.city}
          onOpenHome={() => navigate('home')}
          onOpenMenu={() => setMenuOpen(true)}
          menuEnabled={menuEnabled}
        />
      )}

      <main
        ref={scrollRef}
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {(activeView === 'home' || activeView === 'lodging') && (
          <GuideStayHome
            lodging={lodging}
            pois={pois}
            departureDone={departureDone}
            onNavigate={navigate}
            onOpenWifi={() => setWifiOpen(true)}
            onOpenPoi={openPoi}
            onShowPoiOnMap={showOnMap}
            travelTimes={travelTimes}
            transportEntry={<GuideTransportEntry lodging={lodging} onOpen={() => navigate('transport')} />}
          />
        )}
        {activeView === 'transport' && (
          <GuideTransportView
            lodging={lodging}
            onBack={() => navigate('home')}
            onOpenPoi={poiId => {
              const poi = transportPois.find(item => item.id === poiId) ?? pois.find(item => item.id === poiId)
              if (poi) openPoi(poi)
            }}
          />
        )}
        {activeView === 'arrival' && (
          <GuideArrivalFlow
            lodging={lodging}
            arrived={stay.arrived}
            onArrived={() => sendStayEvent('arrived')}
            onBack={() => navigate('home')}
          />
        )}
        {activeView === 'departure' && (
          <GuideDepartureView
            lodging={lodging}
            checked={stay.checked}
            onToggle={stay.toggle}
            departed={stay.departed}
            onDeparted={() => sendStayEvent('departed')}
            onBack={() => navigate('home')}
          />
        )}
        {activeView === 'rules' && (
          <GuideHouseGuide
            lodging={lodging}
            onBack={() => navigate('home')}
          />
        )}
        {activeView === 'help' && (
          <GuideHelpView
            lodging={lodging}
            installCard={mode === 'private' ? <GuideInstallCard lodgingId={lodging.id} /> : undefined}
          />
        )}
        {activeView === 'lodgings' && (
          <GuideLodgingsView lodgings={lodgings ?? []} onOpen={openLodgingDetail} />
        )}
        {activeView === 'blog' && (
          <GuideBlogView posts={blogPosts ?? []} onOpen={openBlogDetail} />
        )}
        {activeView === 'lodging-detail' && (
          <GuideLodgingDetailView
            detail={lodgingDetail}
            onBack={() => navigate('lodgings')}
          />
        )}
        {activeView === 'blog-detail' && (
          <GuideBlogDetailView detail={blogDetail} onBack={() => navigate('blog')} />
        )}
        {activeView === 'contact' && contact && <GuideContactView contact={contact} />}
        {activeView === 'favorites' && (
          <GuideFavoritesPage
            pois={pois}
            city={lodging.city}
            origin={lodging.locationPrecise ? { latitude: lodging.latitude, longitude: lodging.longitude } : null}
            travelTimes={travelTimes}
            selectedCategorySlug={selectedCategorySlug}
            scrollContainerRef={scrollRef}
            onFilter={filterCategory}
            onSelectPoi={openPoi}
            onShowOnMap={showOnMap}
          />
        )}
        {activeView === 'poi' && selectedPoi && (
          <GuidePoiDetails
            mode={mode}
            poi={selectedPoi}
            lodging={lodging}
            travel={travelTimes?.[selectedPoi.id]}
            onBack={() => navigate(poiOrigin)}
            backLabel={poiOrigin === 'transport' ? 'Retour aux transports' : undefined}
            onShowOnMap={showOnMap}
            onStartTrail={onStartTrail}
          />
        )}
        {activeView === 'map' && (
          <GuideMapView
            lodging={lodging}
            pois={[...pois, ...transportPois]}
            selectedPoiId={selectedPoiId}
            selectedCategorySlug={selectedCategorySlug}
            onFilter={filterCategory}
            onSelectPoi={poi => setSelectedPoiId(poi.id)}
            onDeselectPoi={() => setSelectedPoiId(null)}
            onOpenPoi={openPoi}
          />
        )}
      </main>

      {!fullScreen && (
        <GuideNavigation activeView={activeView} onNavigate={navigateFromTab} />
      )}

      <GuideWifiSheet
        open={wifiOpen}
        name={lodging.wifiName}
        password={lodging.wifiPassword}
        onClose={() => setWifiOpen(false)}
      />

      {menuEnabled ? (
        <GuideMenuOverlay
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigate={navigate}
          lodgingName={lodging.name}
          items={menuItems}
        />
      ) : null}
    </div>
  )
}
