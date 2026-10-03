/** @jest-environment jsdom */

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { GuideTransportEntry } from '@/features/transport/components/GuideTransportEntry'
import { GuideTransportView } from '@/features/transport/components/GuideTransportView'
import { buildStayLodging } from '../support/guide-stay-lodging'

const meta = { fetchedAt: '2026-10-02T08:00:00.000Z', sourceUpdatedAt: null, freshness: 'unknown' as const }
const station = {
  id: 'dmc', name: 'Télécabine de Saint Gervais / Le Chatelet', latitude: 45.89, longitude: 6.707,
  routes: [
    { shortName: '2', longName: 'Télécabines/Le Châtelet - Les Pratz/Sporting Club', color: '#e72438', textColor: '#ffffff' },
    { shortName: '1', longName: 'Télécabines/Le Châtelet - Saint Nicolas de Véroce', color: '#228947', textColor: '#ffffff' },
  ],
  distanceMeters: 105,
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

describe('055 US-01 — transport entry on the stay home', () => {
  it('AC-01-01: shows only Se déplacer without preloading shuttle data', () => {
    const fetchMock = mockApi({})
    const onOpen = jest.fn()
    render(<GuideTransportEntry lodging={buildStayLodging()} onOpen={onOpen} />)

    fireEvent.click(screen.getByRole('button', { name: /Se déplacer/ }))
    expect(onOpen).toHaveBeenCalled()
    expect(screen.queryByRole('region', { name: 'Prochaines navettes' })).not.toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('AC-01-02: shows no entry when the city has no transport', () => {
    render(<GuideTransportEntry lodging={buildStayLodging({ facilibus: false, transportCards: [] })} onOpen={jest.fn()} />)
    expect(screen.queryByRole('button', { name: /Se déplacer/ })).not.toBeInTheDocument()
  })
})

describe('055 US-03 — Se déplacer', () => {
  it('AC-03-01: lists the shuttle card then the city cards', () => {
    mockApi({})
    render(<GuideTransportView lodging={buildStayLodging()} onBack={jest.fn()} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Se déplacer' })).toBeInTheDocument()
    const shuttle = screen.getByRole('button', { name: /Navette gratuite/ })
    expect(within(shuttle).getByText('Gratuit')).toHaveClass('bg-[#FF6B00]')
    expect(within(shuttle).queryByText('Facilibus')).not.toBeInTheDocument()
    expect(shuttle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(shuttle)
    expect(shuttle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /Choisir un arrêt/ })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Voir les horaires' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Taxi/ })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('Sur réservation')).toBeInTheDocument()
  })

  it('hides the shuttle card outside the Facilibus cities', () => {
    render(<GuideTransportView lodging={buildStayLodging({ facilibus: false })} onBack={jest.fn()} />)
    expect(screen.queryByRole('button', { name: /Navette gratuite/ })).not.toBeInTheDocument()
  })

  it('opens city card details and an internal destination without leaving the guide', () => {
    const onOpenPoi = jest.fn()
    render(<GuideTransportView
      lodging={buildStayLodging({ facilibus: false, transportCards: [{
        id: 'tram', title: 'Tramway', tag: 'Sur réservation', body: 'Le tram traverse la vallée.', is_free: true,
        details: 'Arrêt à la gare.\nBillet requis.', image_url: 'https://example.com/tram.webp',
        poi_id: 'poi-1', external_url: 'https://example.com/horaires', cta_label: 'Voir les horaires',
      }] })}
      onBack={jest.fn()} onOpenPoi={onOpenPoi}
    />)

    const trigger = screen.getByRole('button', { name: /Tramway/ })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(within(trigger).getByText('Gratuit')).toBeInTheDocument()
    expect(within(trigger).getByText('Sur réservation')).toBeInTheDocument()
    expect(trigger.querySelector('img')).toHaveAttribute('src', 'https://example.com/tram.webp')
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/Billet requis/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Voir la destination' }))
    expect(onOpenPoi).toHaveBeenCalledWith('poi-1')
    expect(screen.getByRole('link', { name: 'Voir les horaires' })).toHaveAttribute('href', 'https://example.com/horaires')
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('055 US-02 — Facilibus accordion', () => {
  it('AC-02-01/06: keeps one compact selector below the map and reveals nearby and other stops', async () => {
    const other = { ...station, id: 'comtesse', name: 'La Comtesse', distanceMeters: 640 }
    const far = { ...station, id: 'gare', name: 'Gare SNCF', distanceMeters: 1200 }
    const fetchMock = mockApi({
      '/api/transport/facilibus/nearby': { status: 'available', data: { stations: [station, other], maxDistanceMeters: 800 }, meta },
      '/api/transport/facilibus/stops': { status: 'available', data: [station, other, far], meta },
      '/api/transport/facilibus/departures?stationId=dmc': {
        status: 'available', meta: { ...meta, coverage: { from: meta.fetchedAt, to: '2026-10-03T08:00:00.000Z', partial: false } },
        data: { station: { id: 'dmc', name: station.name }, departures: [departure({ vehicleLocated: true, status: 'approaching' })] },
      },
      '/api/transport/facilibus/departures?stationId=comtesse': {
        status: 'no_departures', meta: { ...meta, coverage: { from: meta.fetchedAt, to: '2026-10-03T08:00:00.000Z', partial: false } },
        data: { station: { id: 'comtesse', name: 'La Comtesse' }, departures: [] },
      },
    })
    render(<GuideTransportView lodging={buildStayLodging()} onBack={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Navette gratuite/ }))

    expect((await screen.findAllByText("105 m à vol d'oiseau")).length).toBeGreaterThan(0)
    expect(await screen.findByText('En approche')).toBeInTheDocument()

    // Légende des couleurs : une ligne par numéro, nom officiel du réseau.
    const legend = screen.getByRole('region', { name: 'Lignes' })
    expect(within(legend).getByText('Votre logement')).toBeInTheDocument()
    expect(within(legend).getAllByText(/↔/).map(node => node.textContent)).toEqual([
      'Télécabines / Le Châtelet ↔ Saint Nicolas de Véroce',
      'Télécabines / Le Châtelet ↔ Les Pratz / Sporting Club',
    ])
    expect(within(legend).getByLabelText('Ligne 1')).toBeInTheDocument()
    expect(screen.getByText('Navette en circulation')).toBeInTheDocument()

    const selector = screen.getByRole('button', { name: /Arrêt sélectionné/ })
    expect(selector).toHaveAttribute('aria-expanded', 'false')
    expect(selector).toHaveTextContent(station.name)
    expect(screen.queryByRole('region', { name: 'Arrêts proches' })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Arrêt' })).not.toBeInTheDocument()

    fireEvent.click(selector)
    expect(selector).toHaveAttribute('aria-expanded', 'true')
    const nearbyList = screen.getByRole('region', { name: 'Arrêts proches' })
    expect(within(nearbyList).getByRole('button', { name: /La Comtesse/ })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Tous les arrêts' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tous les arrêts' }))
    expect(within(screen.getByRole('region', { name: 'Tous les arrêts' })).getByRole('button', { name: 'Gare SNCF' })).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(within(nearbyList).getByRole('button', { name: /La Comtesse/ }))
    })
    expect(await screen.findByText('Aucun départ dans les prochaines 24 h.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('stationId=comtesse'))).toBe(true)
    expect(selector).toHaveAttribute('aria-expanded', 'false')
    expect(selector).toHaveTextContent('La Comtesse')
  })

  it('reports partial coverage and outages without inventing an absence of service', async () => {
    mockApi({
      '/api/transport/facilibus/stops': { status: 'available', data: [station], meta },
      '/api/transport/facilibus/departures': {
        status: 'no_departures', meta: { ...meta, coverage: { from: meta.fetchedAt, to: '2026-12-18T23:00:00.000Z', partial: true } },
        data: { station: { id: 'dmc', name: station.name }, departures: [] },
      },
    })
    render(<GuideTransportView lodging={buildStayLodging({ locationPrecise: false })} onBack={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Navette gratuite/ }))
    // Sans coordonnées précises : aucun arrêt imposé, le voyageur choisit.
    const picker = await screen.findByRole('button', { name: /Choisir un arrêt/ })
    expect(screen.queryByRole('region', { name: 'Prochains départs' })).not.toBeInTheDocument()
    fireEvent.click(picker)
    fireEvent.click(within(screen.getByRole('region', { name: 'Tous les arrêts' })).getByRole('button', { name: station.name }))
    expect(await screen.findByText(/Horaires publiés jusqu’au 18\/12/)).toBeInTheDocument()
    expect(screen.queryByText("105 m à vol d'oiseau")).not.toBeInTheDocument()
  })

  it('shows an outage message when schedules are unavailable', async () => {
    mockApi({
      '/api/transport/facilibus/stops': { status: 'available', data: [station], meta },
      '/api/transport/facilibus/departures': { status: 'unavailable', meta, data: { station: null, departures: [] } },
    })
    render(<GuideTransportView lodging={buildStayLodging({ locationPrecise: false })} onBack={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Navette gratuite/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Choisir un arrêt/ }))
    fireEvent.click(within(screen.getByRole('region', { name: 'Tous les arrêts' })).getByRole('button', { name: station.name }))
    expect(await screen.findByText('Horaires momentanément indisponibles.')).toBeInTheDocument()
  })
})

describe('057 — walking time to the station', () => {
  it('shows the real walking time instead of the crow-fly distance', async () => {
    mockApi({
      '/api/transport/facilibus/nearby': {
        status: 'available', meta,
        data: { stations: [{ ...station, travel: { walkingSeconds: 150, drivingSeconds: 90 } }], maxDistanceMeters: 800 },
      },
      '/api/transport/facilibus/departures': {
        status: 'available', meta, data: { station: { id: 'dmc', name: station.name }, departures: [departure()] },
      },
    })
    render(<GuideTransportView lodging={buildStayLodging()} onBack={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Navette gratuite/ }))

    const departures = await screen.findByRole('region', { name: 'Prochains départs' })
    expect(within(departures).getByLabelText('À pied')).toBeInTheDocument()
    expect(within(departures).getByText('3 min')).toBeInTheDocument()
    expect(within(departures).queryByText(/vol d'oiseau/)).not.toBeInTheDocument()
  })
})
