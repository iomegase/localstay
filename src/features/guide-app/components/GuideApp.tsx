'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePathname, useRouter } from 'next/navigation'
import { GuideFavoritesPage } from './GuideFavoritesPage'
import { GuideHeader } from './GuideHeader'
import { GuideHome } from './GuideHome'
import { GuideLodgingViews } from './GuideLodgingViews'
import { GuideLodgingsView } from './GuideLodgingsView'
import { GuideBlogView } from './GuideBlogView'
import { GuideLodgingDetailView } from './GuideLodgingDetailView'
import { GuideBlogDetailView } from './GuideBlogDetailView'
import { GuideContactView, type GuideContactInfo } from './GuideContactView'
import { GuideMenuOverlay } from './GuideMenuOverlay'
import type { GuideMenuItem } from './GuideMenuOverlay'
import { GuideNavigation } from './GuideNavigation'
import { GuidePoiDetails } from './GuidePoiDetails'
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

type GuideAppProps = {
  mode: GuideMode
  lodging: GuideLodging
  pois: GuidePoi[]
  citySlug?: string
  initialView?: GuideView
  routes?: GuideRouteMap
  menuItems?: GuideMenuItem[]
  lodgings?: GuideLodgingCard[]
  blogPosts?: GuideBlogPost[]
  contact?: GuideContactInfo
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
  const pathname = usePathname()
  const router = useRouter()
  const citySlug = props.mode === 'private' ? props.citySlug : undefined

  return (
    <GuideAppShell
      {...props}
      routes={routes}
      onOpenRoute={href => {
        if (href === pathname) return false
        router.push(href)
        return true
      }}
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
  initialView = 'home',
  routes,
  menuItems,
  lodgings,
  blogPosts,
  contact,
  onOpenRoute,
  onStartTrail,
}: GuideAppProps & {
  onOpenRoute?: (href: string) => boolean
  onStartTrail?: (poi: GuidePoi) => void
}) {
  const [activeView, setActiveView] = useState<GuideView>(initialView)
  const scrollRef = useRef<HTMLElement>(null)
  const navHidden = useAutoHideOnScroll(scrollRef, activeView)
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
    () => pois.find(poi => poi.id === selectedPoiId) ?? null,
    [pois, selectedPoiId],
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
    // Une nouvelle route laisse l'App Router monter la vue cible une seule fois.
    // Si l'URL est déjà courante (ex. retour carte → favoris) ou si la vue n'a
    // pas de route, la navigation reste locale dans le GuideApp.
    const href = view === 'poi' ? undefined : routes?.[view]
    if (href && onOpenRoute?.(href)) return

    if (view !== 'poi' && view !== 'map') {
      setSelectedPoiId(null)
    }
    setActiveView(view)
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
      {activeView !== 'poi' && (
        <GuideHeader
          city={lodging.city}
          onOpenHome={() => navigate('home')}
          onOpenMenu={() => setMenuOpen(true)}
        />
      )}

      <main
        ref={scrollRef}
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {activeView === 'home' && (
          <GuideHome lodging={lodging} pois={pois} onNavigate={navigate} />
        )}
        {['lodging', 'arrival', 'departure', 'practical', 'rules'].includes(activeView) && (
          <GuideLodgingViews
            view={
              activeView as Extract<
                GuideView,
                'lodging' | 'arrival' | 'departure' | 'practical' | 'rules'
              >
            }
            lodging={lodging}
            onNavigate={navigate}
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
            onBack={() => navigate(poiOrigin)}
            onShowOnMap={showOnMap}
            onStartTrail={onStartTrail}
          />
        )}
        {activeView === 'map' && (
          <GuideMapView
            lodging={lodging}
            pois={pois}
            selectedPoiId={selectedPoiId}
            selectedCategorySlug={selectedCategorySlug}
            onFilter={filterCategory}
            onSelectPoi={poi => setSelectedPoiId(poi.id)}
            onOpenPoi={openPoi}
          />
        )}
      </main>

      {activeView !== 'poi' && (
        <GuideNavigation
          activeView={activeView}
          onNavigate={navigateFromTab}
          hidden={navHidden}
        />
      )}

      <GuideMenuOverlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={navigate}
        lodgingName={lodging.name}
        items={menuItems}
      />
    </div>
  )
}

/**
 * Masque la barre de nav quand on scrolle vers le bas dans le conteneur donné,
 * la révèle en scrollant vers le haut, à l'arrêt du scroll, et toujours en
 * haut/bas de contenu. Respecte prefers-reduced-motion. Réinitialisée à chaque
 * changement de vue.
 */
function useAutoHideOnScroll(
  ref: React.RefObject<HTMLElement | null>,
  resetKey: unknown,
): boolean {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    setHidden(false)

    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let lastY = el.scrollTop
    let idleTimer = 0

    const onScroll = () => {
      const y = el.scrollTop
      const max = el.scrollHeight - el.clientHeight

      if (reduce || y <= 8 || y >= max - 8) {
        setHidden(false)
      } else if (y > lastY + 4) {
        setHidden(true)
      } else if (y < lastY - 4) {
        setHidden(false)
      }
      lastY = y

      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => setHidden(false), 160)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.clearTimeout(idleTimer)
    }
  }, [ref, resetKey])

  return hidden
}
