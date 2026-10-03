/** @jest-environment jsdom */

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { GuideFavoritesPage } from '@/features/guide-app/components/GuideFavoritesPage'
import { buildStayPoi } from '../support/guide-stay-lodging'

const mockLocation = { location: null as null | { latitude: number; longitude: number }, status: 'idle', requestLocation: jest.fn(), clearLocation: jest.fn(), dismiss: jest.fn() }
jest.mock('@/features/geolocation/hooks/useUserLocation', () => ({ useUserLocation: () => mockLocation }))

const pois = [
  buildStayPoi({ id: 'p1', name: 'Le Bettex', latitude: 45.8915, longitude: 6.7115 }),
  buildStayPoi({ id: 'p2', name: 'Lac', latitude: 45.95, longitude: 6.8 }),
]
const travel = { p1: { walkingSeconds: 360, drivingSeconds: 120 }, p2: { walkingSeconds: 7200, drivingSeconds: 1080 } }

function renderPage(travelTimes: typeof travel | null = travel) {
  render(
    <GuideFavoritesPage
      pois={pois}
      city="Saint-Gervais-les-Bains"
      origin={{ latitude: 45.8915, longitude: 6.7085 }}
      travelTimes={travelTimes}
      selectedCategorySlug={null}
      onFilter={jest.fn()}
      onSelectPoi={jest.fn()}
      onShowOnMap={jest.fn()}
    />,
  )
}

describe('057 guide tab travel times', () => {
  beforeEach(() => {
    mockLocation.location = null
    mockLocation.status = 'idle'
    jest.clearAllMocks()
  })

  it('AC-01-01: shows one real travel time per card from the lodging', () => {
    renderPage()
    expect(screen.queryByText('Temps de trajet estimés depuis le logement')).not.toBeInTheDocument()
    const [first, second] = screen.getAllByTestId('favorite-bento-card')
    expect(within(first).getByLabelText('À pied')).toBeInTheDocument()
    expect(within(first).getByText('6 min')).toBeInTheDocument()
    expect(within(second).getByLabelText('En voiture')).toBeInTheDocument()
    expect(within(second).getByText('18 min')).toBeInTheDocument()
  })

  it('AC-01-03: falls back to crow-fly distances when travel times are unavailable', () => {
    renderPage(null)
    expect(screen.getByText("Distances à vol d'oiseau depuis le logement")).toBeInTheDocument()
    expect(within(screen.getAllByTestId('favorite-bento-card')[0]).getByText('230 m')).toBeInTheDocument()
  })

  it('AC-02-01: offers « Utiliser ma position » and then shows distances from the traveller', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Utiliser ma position' }))
    expect(mockLocation.requestLocation).toHaveBeenCalled()
    cleanup()

    mockLocation.location = { latitude: 45.8915, longitude: 6.7085 }
    mockLocation.status = 'ready'
    renderPage()
    expect(screen.getByText("Distances à vol d'oiseau depuis votre position")).toBeInTheDocument()
    expect(within(screen.getAllByTestId('favorite-bento-card')[0]).getByText('230 m de vous')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ne plus utiliser ma position' }))
    expect(mockLocation.clearLocation).toHaveBeenCalled()
  })
})

describe('057 AC-01-02 — POI detail', () => {
  it('shows both walking and driving times from the lodging', async () => {
    const { GuidePoiDetails } = await import('@/features/guide-app/components/GuidePoiDetails')
    const { buildStayLodging } = await import('../support/guide-stay-lodging')
    render(
      <GuidePoiDetails
        mode="private"
        poi={pois[0]}
        lodging={buildStayLodging()}
        travel={{ walkingSeconds: 360, drivingSeconds: 120 }}
        onBack={jest.fn()}
        onShowOnMap={jest.fn()}
      />,
    )
    const line = screen.getByTestId('poi-detail-travel')
    expect(line).toHaveTextContent('À pied 6 min')
    expect(line).toHaveTextContent('En voiture 2 min')
    expect(line).toHaveTextContent('depuis le logement')
  })

  it('shows no lodging distance when the lodging is not geolocated', async () => {
    const { GuidePoiDetails } = await import('@/features/guide-app/components/GuidePoiDetails')
    const { buildStayLodging } = await import('../support/guide-stay-lodging')
    render(
      <GuidePoiDetails
        mode="private"
        poi={pois[0]}
        lodging={buildStayLodging({ locationPrecise: false })}
        onBack={jest.fn()}
        onShowOnMap={jest.fn()}
      />,
    )
    expect(screen.queryByTestId('poi-detail-distance')).not.toBeInTheDocument()
    expect(screen.queryByTestId('poi-detail-travel')).not.toBeInTheDocument()
  })
})
