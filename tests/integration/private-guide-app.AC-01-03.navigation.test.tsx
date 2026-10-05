/** @jest-environment jsdom */

import type { ComponentProps } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { GuideApp } from '@/features/guide-app/components/GuideApp'
import { PRIVATE_GUIDE_ROUTES } from '@/features/guide-app/components/PrivateGuidePage'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'
import { demoPois } from '@/features/guide-demo/demo-pois'

const mockPush = jest.fn()
const mockMapModuleLoaded = jest.fn()
const mockGuidePoiDetailsProps = jest.fn()
let mockPathname = '/sejour'

// next/server (after) exige Request, absent de jsdom : traduction neutre en français.
jest.mock('@/features/content-translation/queries/lodging-showcase', () => ({
  localizeLodgingCards: jest.fn(async (cards: unknown) => cards),
  localizeLodgingDetail: jest.fn(async (_id: string, detail: unknown) => detail),
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush }),
}))
jest.mock('@/features/guide-app/components/GuideMapView', () => {
  mockMapModuleLoaded()
  return { GuideMapView: () => <div>Carte chargée</div> }
})

jest.mock('next/dynamic', () => () => {
  function DynamicGuideMapStub() {
    return <div>Chargement de la carte…</div>
  }

  return DynamicGuideMapStub
})

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn(),
}))
jest.mock('@/features/guide-app/queries/private-guide-data', () => ({
  getPrivateGuideData: jest.fn(),
}))
jest.mock('@/features/analytics/lib/record-qr-scan', () => ({
  recordQrScanIfPresent: jest.fn(),
}))

jest.mock('@/features/guide-app/components/GuidePoiDetails', () => {
  const actual = jest.requireActual<
    typeof import('@/features/guide-app/components/GuidePoiDetails')
  >('@/features/guide-app/components/GuidePoiDetails')
  const ActualGuidePoiDetails = actual.GuidePoiDetails

  function ObservedGuidePoiDetails(
    props: ComponentProps<typeof ActualGuidePoiDetails>,
  ) {
    mockGuidePoiDetailsProps(props)
    return <ActualGuidePoiDetails {...props} />
  }

  return { GuidePoiDetails: ObservedGuidePoiDetails }
})

describe('034-private-guide-app route-aware shell', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockGuidePoiDetailsProps.mockClear()
    mockPathname = '/sejour'
    window.history.replaceState(null, '', '/sejour')
  })

  it('054 AC-01-12: preloads map code after hydration without mounting it', async () => {
    jest.useFakeTimers()
    try {
      render(<GuideApp mode="private" lodging={demoLodging} pois={[]} routes={PRIVATE_GUIDE_ROUTES} />)
      expect(mockMapModuleLoaded).not.toHaveBeenCalled()
      await act(async () => { jest.advanceTimersByTime(200) })
      expect(mockMapModuleLoaded).toHaveBeenCalledTimes(1)
      expect(screen.queryByText('Carte chargée')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Accueil' })).toHaveAttribute('aria-current', 'page')
    } finally {
      jest.useRealTimers()
    }
  })

  it('054 AC-01-10: fetches shared travel times once across tab changes', async () => {
    const originalFetch = globalThis.fetch
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'available', data: {} }) })
    globalThis.fetch = fetchMock
    try {
      render(<GuideApp mode="private" lodging={{ ...demoLodging, locationPrecise: true }} pois={demoPois} routes={PRIVATE_GUIDE_ROUTES} />)
      await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/guide/travel-times', expect.any(Object)))
      for (const label of ['Coups de cœur', 'Réglages et infos', 'Accueil', 'Carte', 'Réglages et infos']) {
        fireEvent.click(screen.getByRole('button', { name: label, exact: true }))
      }
      expect(fetchMock.mock.calls.filter(([url]) => url === '/api/guide/travel-times')).toHaveLength(1)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('054 AC-01-01/02: uses private routes from the stay home tiles and tabs', () => {
    render(
      <GuideApp
        mode="private"
        lodging={{ ...demoLodging, name: 'Le Chalet Hygge' }}
        pois={[]}
        routes={PRIVATE_GUIDE_ROUTES}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Coups de cœur' }))
    expect(window.location.pathname).toBe('/sejour/coups-de-coeur')
    fireEvent.click(screen.getByRole('button', { name: 'Accueil' }))

    fireEvent.click(screen.getByRole('button', { name: /^Guide.*Du logement/ }))
    expect(window.location.pathname).toBe('/sejour/logement/consignes')
    expect(screen.getByRole('heading', { name: 'Guide logement' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Revenir au séjour' }))

    fireEvent.click(screen.getByRole('button', { name: /^Arrivée/ }))
    expect(window.location.pathname).toBe('/sejour/logement/arrivee')
    expect(screen.getByRole('heading', { name: 'Arrivée' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Revenir au séjour' }))

    fireEvent.click(screen.getByRole('button', { name: /^Départ/ }))
    expect(window.location.pathname).toBe('/sejour/logement/depart')
    expect(screen.getByRole('heading', { name: 'Départ' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Revenir au séjour' }))

    mockPush.mockClear()
    fireEvent.click(screen.getByRole('button', { name: /^Wi-Fi/ }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('054 AC-01-09: renders favorites on the first click without a server transition', () => {
    render(<GuideApp mode="private" lodging={demoLodging} pois={demoPois} routes={PRIVATE_GUIDE_ROUTES} />)

    fireEvent.click(screen.getByRole('button', { name: 'Coups de cœur' }))

    expect(screen.getByTestId('favorites-bento-grid')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/sejour/coups-de-coeur')
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('054 AC-01-10: keeps the latest tab during rapid navigation without refetching stay data', () => {
    render(<GuideApp mode="private" lodging={demoLodging} pois={demoPois} routes={PRIVATE_GUIDE_ROUTES} />)
    const originalNav = screen.getByRole('navigation', { name: 'Navigation du guide' })
    for (let i = 0; i < 3; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Coups de cœur' }))
      fireEvent.click(screen.getByRole('button', { name: 'Réglages et infos' }))
      fireEvent.click(screen.getByRole('button', { name: 'Accueil' }))
      fireEvent.click(screen.getByRole('button', { name: 'Carte' }))
      fireEvent.click(screen.getByRole('button', { name: 'Réglages et infos' }))
    }
    expect(screen.getByRole('heading', { name: 'Réglages et infos' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navigation du guide' })).toBe(originalNav)
    expect(window.location.hash).toBe('#reglages')
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('054 AC-01-11: restores the view from back/forward URLs and does not duplicate a repeated tab', () => {
    render(<GuideApp mode="private" lodging={demoLodging} pois={demoPois} routes={PRIVATE_GUIDE_ROUTES} />)
    fireEvent.click(screen.getByRole('button', { name: 'Réglages et infos' }))
    const historyLength = window.history.length
    fireEvent.click(screen.getByRole('button', { name: 'Réglages et infos' }))
    expect(window.history.length).toBe(historyLength)
    act(() => {
      window.history.replaceState(null, '', '/sejour/coups-de-coeur')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(screen.getByTestId('favorites-bento-grid')).toBeInTheDocument()
    act(() => {
      window.history.replaceState(null, '', '/sejour#reglages')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(screen.getByRole('heading', { name: 'Réglages et infos' })).toBeInTheDocument()
  })

  it('054 AC-01-11: opens settings directly from its fragment', () => {
    window.history.replaceState(null, '', '/sejour#reglages')
    render(<GuideApp mode="private" lodging={demoLodging} pois={[]} routes={PRIVATE_GUIDE_ROUTES} />)
    expect(screen.getByRole('heading', { name: 'Réglages et infos' })).toBeInTheDocument()
  })

  it('040 AC-01: opens the shared map view inside the private guide frame', () => {
    expect(PRIVATE_GUIDE_ROUTES.map).toBeUndefined()

    render(
      <GuideApp
        mode="private"
        lodging={demoLodging}
        pois={demoPois}
        routes={PRIVATE_GUIDE_ROUTES}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Carte' }))

    expect(mockPush).not.toHaveBeenCalledWith('/map')
    expect(screen.getByText('Chargement de la carte…')).toBeInTheDocument()
  })

  it('040 AC-02: returns to favorites from the unrouted map tab', () => {
    // Régression : la carte n'a pas de route, donc l'URL reste sur /sejour/coups-de-coeur.
    // Taper « Coups de cœur » y repousse la même URL → router.push est un no-op (mockPush).
    // La vue doit donc rebasculer côté client, sinon on reste bloqué sur la carte.
    expect(PRIVATE_GUIDE_ROUTES.map).toBeUndefined()
    mockPathname = '/sejour/coups-de-coeur'

    render(
      <GuideApp
        mode="private"
        lodging={demoLodging}
        pois={demoPois}
        initialView="favorites"
        routes={PRIVATE_GUIDE_ROUTES}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Carte' }))
    expect(screen.getByText('Chargement de la carte…')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Coups de cœur' }))
    expect(screen.queryByText('Chargement de la carte…')).not.toBeInTheDocument()
  })

  it('resets an active favorites tab without remounting its page', () => {
    mockPathname = '/sejour/coups-de-coeur'
    render(
      <GuideApp
        mode="private"
        lodging={demoLodging}
        pois={demoPois}
        initialView="favorites"
        routes={PRIVATE_GUIDE_ROUTES}
      />,
    )

    const originalGrid = screen.getByTestId('favorites-bento-grid')
    const scrollContainer = originalGrid.closest('main')

    if (!scrollContainer) {
      throw new Error('Expected favorites scroll container')
    }

    Object.defineProperty(scrollContainer, 'scrollTo', {
      configurable: true,
      value: jest.fn(),
    })

    fireEvent.click(screen.getByRole('button', { name: 'Coups de cœur' }))

    expect(screen.getByTestId('favorites-bento-grid')).toBe(originalGrid)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('renders functional private menu links', () => {
    render(
      <GuideApp
        mode="private"
        lodging={demoLodging}
        pois={[]}
        routes={{ home: '/sejour', lodging: '/le-logement', map: '/map' }}
        menuItems={[
          { label: 'Bienvenue', href: '/sejour' },
          { label: 'Vos favoris', href: '/mes-favoris' },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    expect(screen.getByRole('link', { name: 'Bienvenue' })).toHaveAttribute(
      'href',
      '/sejour',
    )
    expect(screen.getByRole('link', { name: 'Vos favoris' })).toHaveAttribute(
      'href',
      '/mes-favoris',
    )
  })

  it('054: the legacy lodging route renders the stay home', () => {
    render(
      <GuideApp
        mode="private"
        lodging={demoLodging}
        pois={[]}
        initialView="lodging"
        routes={PRIVATE_GUIDE_ROUTES}
      />,
    )

    expect(screen.getByRole('button', { name: /^Guide.*Du logement/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Accueil' })).toHaveAttribute('aria-current', 'page')
  })

  it('054 AC-04-01: returns from the house guide immediately without a server transition', () => {
    mockPathname = '/sejour/logement/consignes'
    render(
      <GuideApp
        mode="private"
        lodging={demoLodging}
        pois={[]}
        initialView="rules"
        routes={PRIVATE_GUIDE_ROUTES}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Revenir au séjour' }))

    expect(window.location.pathname).toBe('/sejour')
    expect(screen.queryByRole('heading', { name: 'Guide logement' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Guide.*Du logement/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Accueil' })).toHaveAttribute('aria-current', 'page')
  })

  it('keeps practical contacts out of the house guide', () => {
    mockPathname = '/sejour/logement/consignes'
    render(
      <GuideApp
        mode="private"
        lodging={demoLodging}
        pois={[]}
        initialView="rules"
        routes={PRIVATE_GUIDE_ROUTES}
      />,
    )

    expect(screen.queryByRole('heading', { name: 'Infos pratiques' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Urgences 112/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Conciergerie/ })).not.toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalledWith('/sejour/logement/informations-pratiques')
  })

  it('opens a transport destination inside the guide and returns to transport', () => {
    const poi = demoPois[0]
    render(<GuideApp
      mode="private"
      lodging={{ ...demoLodging, facilibus: false, transportCards: [{
        id: 'transport-1', title: 'Tramway', tag: null, body: 'Départ à la gare.', poi_id: poi.id,
      }] }}
      pois={[]}
      transportPois={[poi]}
      initialView="transport"
      routes={PRIVATE_GUIDE_ROUTES}
    />)

    fireEvent.click(screen.getByRole('button', { name: /Tramway/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Voir la destination' }))
    expect(mockGuidePoiDetailsProps.mock.lastCall?.[0].poi.id).toBe(poi.id)
    expect(screen.getByRole('button', { name: 'Retour aux transports' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retour aux transports' }))
    expect(screen.getByRole('heading', { name: 'Se déplacer' })).toBeInTheDocument()
  })

  it('054 AC-01-05: opens the help tab locally and writes to the concierge', () => {
    render(
      <GuideApp
        mode="private"
        lodging={demoLodging}
        pois={[]}
        routes={PRIVATE_GUIDE_ROUTES}
        contact={{ lodgingId: 'lodging-1', lodgingName: 'Le 305', cityName: 'Saint-Gervais-les-Bains' }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Réglages et infos' }))
    expect(mockPush).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { level: 1, name: 'Réglages et infos' })).toBeInTheDocument()

    expect(screen.queryByRole('button', { name: 'Écrire' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Réglages et infos' })).toHaveAttribute('aria-current', 'page')
  })

  it('021 AC-02-02 + 012 BR-03/BR-08: opens a cross-city private trail from its actual city', () => {
    const porchereyPoi = demoPois.find(
      poi => poi.id === 'demo-poi-porcherey',
    )
    if (!porchereyPoi?.trail) {
      throw new Error('Expected the Porcherey demo trail fixture')
    }
    const privateTrailPoi = {
      ...porchereyPoi,
      slug: 'l-alpage-de-porcherey',
      citySlug: 'les-contamines-montjoie',
      trail: {
        ...porchereyPoi.trail,
        trackingEnabled: true,
      },
    }

    render(
      <GuideApp
        mode="private"
        lodging={demoLodging}
        pois={[privateTrailPoi]}
        citySlug="saint-gervais-les-bains"
        initialView="favorites"
        routes={{
          home: '/sejour',
          favorites: '/sejour/coups-de-coeur',
        }}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: /ouvrir l’alpage de porcherey/i }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Démarrer la randonnée' }),
    )

    expect(mockPush).toHaveBeenLastCalledWith(
      '/guide/les-contamines-montjoie/rando/l-alpage-de-porcherey/start',
    )
  })

  it('021 BR-04: does not provide trail start navigation to a routed demo guide', () => {
    render(
      <GuideApp
        mode="demo"
        lodging={demoLodging}
        pois={demoPois}
        citySlug="saint-gervais-les-bains"
        initialView="favorites"
        routes={{ home: '/', favorites: '/coups-de-coeur' }}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: /ouvrir l’alpage de porcherey/i }),
    )

    const detailsProps = mockGuidePoiDetailsProps.mock.lastCall?.[0]
    expect(detailsProps?.onStartTrail).toBeUndefined()
    expect(
      screen.getByRole('button', { name: 'Commencer la randonnée' }),
    ).toBeDisabled()
  })
})
