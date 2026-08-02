/** @jest-environment jsdom */

import type { ComponentProps } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { GuideApp } from '@/features/guide-app/components/GuideApp'
import { PRIVATE_GUIDE_ROUTES } from '@/features/guide-app/components/PrivateGuidePage'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'
import { demoPois } from '@/features/guide-demo/demo-pois'

const mockPush = jest.fn()
const mockGuidePoiDetailsProps = jest.fn()

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  useRouter: () => ({ push: mockPush }),
}))
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
  })

  it('uses private routes from the shared GuideApp home', () => {
    render(
      <GuideApp
        mode="private"
        lodging={{ ...demoLodging, name: 'Le Chalet Hygge' }}
        pois={[]}
        routes={{
          home: '/sejour',
          favorites: '/sejour/coups-de-coeur',
          lodging: '/sejour/logement',
          map: '/map',
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /explorer/i }))
    expect(mockPush).toHaveBeenCalledWith('/sejour/coups-de-coeur')

    fireEvent.click(screen.getByRole('button', { name: 'Guide logement' }))
    expect(mockPush).toHaveBeenCalledWith('/sejour/logement')
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

  it('opens the canonical arrival page from the lodging guide', () => {
    render(
      <GuideApp
        mode="private"
        lodging={demoLodging}
        pois={[]}
        initialView="lodging"
        routes={{
          home: '/sejour',
          lodging: '/sejour/logement',
          arrival: '/sejour/logement/arrivee',
        }}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: `Arrivée ${demoLodging.checkIn}`,
      }),
    )
    expect(mockPush).toHaveBeenCalledWith('/sejour/logement/arrivee')

    fireEvent.click(screen.getByRole('button', { name: /Accéder au logement/i }))
    expect(mockPush).toHaveBeenLastCalledWith('/sejour/logement/arrivee')
  })

  it('opens the canonical practical information page from the lodging guide', () => {
    render(
      <GuideApp
        mode="private"
        lodging={demoLodging}
        pois={[]}
        initialView="lodging"
        routes={{
          home: '/sejour',
          lodging: '/sejour/logement',
          practical: '/sejour/logement/informations-pratiques',
        }}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: /Informations pratiques/i }),
    )
    expect(mockPush).toHaveBeenCalledWith(
      '/sejour/logement/informations-pratiques',
    )
  })

  it('opens the canonical departure page from the lodging guide', () => {
    render(
      <GuideApp
        mode="private"
        lodging={demoLodging}
        pois={[]}
        initialView="lodging"
        routes={{
          home: '/sejour',
          lodging: '/sejour/logement',
          departure: '/sejour/logement/depart',
        }}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: /Préparer le départ/i }),
    )
    expect(mockPush).toHaveBeenCalledWith('/sejour/logement/depart')
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
