/** @jest-environment jsdom */

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { FacilibusNextDeparturesCard } from '@/features/transport/components/FacilibusNextDeparturesCard'
import { GuideTransportView } from '@/features/transport/components/GuideTransportView'
import { GuideFacilibusView } from '@/features/transport/components/GuideFacilibusView'
import { buildStayLodging } from '../support/guide-stay-lodging'

const meta = { fetchedAt: '2026-10-02T08:00:00.000Z', sourceUpdatedAt: null, freshness: 'unknown' as const }
const station = {
  id: 'dmc', name: 'Télécabine de Saint Gervais / Le Chatelet', latitude: 45.89, longitude: 6.707,
  routes: [{ shortName: '1', color: '#228947', textColor: '#ffffff' }], distanceMeters: 105,
}
const departure = (overrides: Record<string, unknown> = {}) => ({
  id: 'L1A_5:20261002:0:DMC', tripId: 'L1A_5', serviceDate: '20261002', stopSequence: 0, quayId: 'DMC',
  headsign: 'Saint Nicolas de Véroce', scheduledAt: '2026-10-02T09:50:00.000Z', estimatedAt: null,
  referenceAt: '2026-10-02T09:50:00.000Z', delaySeconds: null, realtime: false, status: 'scheduled',
  vehicleLocated: false, route: { shortName: '1', color: '#228947', textColor: '#ffffff' },
  ...overrides,
})

function mockApi(routes: Record<string, unknown>) {
  const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    const key = Object.keys(routes).find(prefix => url.startsWith(prefix))
    if (!key) return { ok: false, json: async () => ({}) } as Response
    return { ok: true, json: async () => routes[key] } as Response
  })
  globalThis.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

const fallback = <button type="button">Se déplacer</button>

describe('055 US-01 — next shuttles on the stay home', () => {
  it('AC-01-01: replaces the transport row with the nearest station departures', async () => {
    mockApi({
      '/api/transport/facilibus/nearby': { status: 'available', data: { stations: [station], maxDistanceMeters: 800 }, meta },
      '/api/transport/facilibus/departures': {
        status: 'available', meta,
        data: { station: { id: 'dmc', name: station.name }, departures: [
          departure(),
          departure({ id: 'b', headsign: 'Les Pratz -Sporting Club', referenceAt: '2026-10-02T10:00:00.000Z', scheduledAt: '2026-10-02T09:58:00.000Z', estimatedAt: '2026-10-02T10:00:00.000Z', delaySeconds: 120, realtime: true, route: { shortName: '2', color: '#e72438', textColor: '#ffffff' } }),
        ] },
      },
    })
    const onOpen = jest.fn()
    render(<FacilibusNextDeparturesCard latitude={45.8915} longitude={6.7085} onOpen={onOpen} fallback={fallback} />)

    const card = await screen.findByRole('region', { name: 'Prochaines navettes' })
    expect(within(card).getByText(station.name)).toBeInTheDocument()
    expect(within(card).getByText("105 m à vol d'oiseau")).toBeInTheDocument()
    expect(within(card).getByText('11:50')).toBeInTheDocument()
    expect(within(card).getByText('Saint Nicolas de Véroce')).toBeInTheDocument()
    expect(within(card).getByText('+2 min')).toBeInTheDocument()
    expect(within(card).getByText('Temps réel')).toBeInTheDocument()
    expect(within(card).queryByText(/min à pied/)).not.toBeInTheDocument()
    fireEvent.click(within(card).getByRole('button', { name: 'Tous les transports' }))
    expect(onOpen).toHaveBeenCalled()
  })

  it('AC-01-02: keeps the transport row outside coverage or when schedules are unavailable', async () => {
    const fetchMock = mockApi({
      '/api/transport/facilibus/nearby': { status: 'outside_coverage', data: { stations: [], maxDistanceMeters: 800 }, meta },
    })
    render(<FacilibusNextDeparturesCard latitude={48.85} longitude={2.35} onOpen={jest.fn()} fallback={fallback} />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(screen.getByRole('button', { name: 'Se déplacer' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Prochaines navettes' })).not.toBeInTheDocument()
  })
})

describe('055 US-03 — Se déplacer', () => {
  it('AC-03-01: lists the shuttle card then the city cards', () => {
    const onOpenFacilibus = jest.fn()
    render(<GuideTransportView lodging={buildStayLodging()} onBack={jest.fn()} onOpenFacilibus={onOpenFacilibus} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Se déplacer' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Navette gratuite/ }))
    expect(onOpenFacilibus).toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Taxi' })).toBeInTheDocument()
    expect(screen.getByText('Sur réservation')).toBeInTheDocument()
  })

  it('hides the shuttle card outside the Facilibus cities', () => {
    render(<GuideTransportView lodging={buildStayLodging({ facilibus: false })} onBack={jest.fn()} onOpenFacilibus={jest.fn()} />)
    expect(screen.queryByRole('button', { name: /Navette gratuite/ })).not.toBeInTheDocument()
  })
})

describe('055 US-02 — Facilibus page', () => {
  it('AC-02-01: shows the nearest station, alternatives and the station picker', async () => {
    const other = { ...station, id: 'comtesse', name: 'La Comtesse', distanceMeters: 640 }
    const fetchMock = mockApi({
      '/api/transport/facilibus/nearby': { status: 'available', data: { stations: [station, other], maxDistanceMeters: 800 }, meta },
      '/api/transport/facilibus/stops': { status: 'available', data: [station, other], meta },
      '/api/transport/facilibus/departures?stationId=dmc': {
        status: 'available', meta: { ...meta, coverage: { from: meta.fetchedAt, to: '2026-10-03T08:00:00.000Z', partial: false } },
        data: { station: { id: 'dmc', name: station.name }, departures: [departure({ vehicleLocated: true, status: 'approaching' })] },
      },
      '/api/transport/facilibus/departures?stationId=comtesse': {
        status: 'no_departures', meta: { ...meta, coverage: { from: meta.fetchedAt, to: '2026-10-03T08:00:00.000Z', partial: false } },
        data: { station: { id: 'comtesse', name: 'La Comtesse' }, departures: [] },
      },
    })
    render(<GuideFacilibusView lodging={buildStayLodging()} onBack={jest.fn()} />)

    expect(await screen.findByText("105 m à vol d'oiseau")).toBeInTheDocument()
    expect(await screen.findByText('En approche')).toBeInTheDocument()
    expect(screen.getByText('Navette en circulation')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /La Comtesse/ }))
    })
    expect(await screen.findByText('Aucun départ dans les prochaines 24 h.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('stationId=comtesse'))).toBe(true)

    const picker = screen.getByRole('combobox', { name: 'Arrêt' })
    expect(within(picker).getAllByRole('option').map(option => option.textContent)).toEqual(
      expect.arrayContaining([station.name, 'La Comtesse']),
    )
  })

  it('reports partial coverage and outages without inventing an absence of service', async () => {
    mockApi({
      '/api/transport/facilibus/stops': { status: 'available', data: [station], meta },
      '/api/transport/facilibus/departures': {
        status: 'no_departures', meta: { ...meta, coverage: { from: meta.fetchedAt, to: '2026-12-18T23:00:00.000Z', partial: true } },
        data: { station: { id: 'dmc', name: station.name }, departures: [] },
      },
    })
    render(<GuideFacilibusView lodging={buildStayLodging({ locationPrecise: false })} onBack={jest.fn()} />)
    // Sans coordonnées précises : aucun arrêt imposé, le voyageur choisit.
    const picker = await screen.findByRole('combobox', { name: 'Arrêt' })
    await screen.findByRole('option', { name: station.name })
    expect(screen.queryByRole('region', { name: 'Prochains départs' })).not.toBeInTheDocument()
    fireEvent.change(picker, { target: { value: 'dmc' } })
    expect(await screen.findByText(/Horaires publiés jusqu’au 18\/12/)).toBeInTheDocument()
    expect(screen.queryByText("105 m à vol d'oiseau")).not.toBeInTheDocument()
  })

  it('shows an outage message when schedules are unavailable', async () => {
    mockApi({
      '/api/transport/facilibus/stops': { status: 'available', data: [station], meta },
      '/api/transport/facilibus/departures': { status: 'unavailable', meta, data: { station: null, departures: [] } },
    })
    render(<GuideFacilibusView lodging={buildStayLodging({ locationPrecise: false })} onBack={jest.fn()} />)
    await screen.findByRole('option', { name: station.name })
    fireEvent.change(screen.getByRole('combobox', { name: 'Arrêt' }), { target: { value: 'dmc' } })
    expect(await screen.findByText('Horaires momentanément indisponibles.')).toBeInTheDocument()
  })
})
