/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import { TrailCardDetails } from '@/features/categories/components/TrailCardDetails'
import type { PoiDetail, TrailDetailData } from '@/features/categories/types'

const fullTrail: TrailDetailData = {
  difficulty: 'medium',
  estimated_duration_min: 210,
  distance_km: 8.4,
  elevation_gain_m: 950,
  start_label: 'Parking du Pont du Diable (1100 m)',
  start_latitude: 45.9,
  start_longitude: 6.7,
  geometry_geojson: {
    type: 'LineString',
    coordinates: [
      [6.7, 45.9],
      [6.71, 45.91],
    ],
  },
  parking_info: 'Parking gratuit au Pont du Diable, 30 places',
  kids_friendly: true,
  pets_friendly: true,
  best_season: ['summer', 'autumn'],
  gpx_url: null,
  data_quality_status: 'complete',
  primary_source_type: 'official_website',
  source_refs: [{ type: 'official_website', attribution: 'www.example.com', used_for: ['content'] }],
}

function buildPayload(trail: TrailDetailData | null): { data: PoiDetail } {
  return {
    data: {
      id: 'poi-trail-1',
      name: 'Lac de Pormenaz',
      slug: 'lac-de-pormenaz',
      description: null,
      address: 'Sentier du lac',
      latitude: 45.9,
      longitude: 6.7,
      phone: null,
      website: null,
      rating: null,
      rating_count: 0,
      is_open_now: null,
      hours: null,
      photos: [],
      distance_km: 5,
      category: { id: 'c', name: 'Rando', slug: 'rando', icon: 'mountain' },
      subcategory: null,
      trail_detail: trail,
      hiking_detail: null,
      merchant_offers: [],
    } as PoiDetail,
  }
}

function mockFetch(resolve: { data: PoiDetail } | 'never' | 'error') {
  if (resolve === 'never') {
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch
    return
  }
  if (resolve === 'error') {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false, status: 500 } as Response),
    ) as unknown as typeof fetch
    return
  }
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(resolve) } as Response),
  ) as unknown as typeof fetch
}

const props = {
  citySlug: 'les-contamines-montjoie',
  categorySlug: 'rando',
  poiSlug: 'lac-de-pormenaz',
  poiName: 'Lac de Pormenaz',
  address: 'Sentier du lac',
}

afterEach(() => {
  jest.resetAllMocks()
})

describe('TrailCardDetails — fetch lifecycle', () => {
  it('shows a loading skeleton before the detail resolves', () => {
    mockFetch('never')
    render(<TrailCardDetails {...props} />)
    expect(screen.getByTestId('trail-details-loading')).toBeInTheDocument()
  })

  it('renders the trail details (start point) once the fetch resolves', async () => {
    mockFetch(buildPayload(fullTrail))
    render(<TrailCardDetails {...props} />)
    expect(await screen.findByTestId('trail-details')).toBeInTheDocument()
    // La fiche détaillée a bien été récupérée → la mini-carte (briques rando) est montée.
    expect(screen.getByTestId('trail-preview-map')).toBeInTheDocument()
  })

  it('renders nothing when the fetch fails', async () => {
    mockFetch('error')
    const { container } = render(<TrailCardDetails {...props} />)
    await waitFor(() => expect(screen.queryByTestId('trail-details-loading')).not.toBeInTheDocument())
    expect(screen.queryByTestId('trail-details')).not.toBeInTheDocument()
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the POI has no trail detail', async () => {
    mockFetch(buildPayload(null))
    const { container } = render(<TrailCardDetails {...props} />)
    await waitFor(() => expect(screen.queryByTestId('trail-details-loading')).not.toBeInTheDocument())
    expect(container).toBeEmptyDOMElement()
  })
})

describe('TrailCardDetails — pratical info (parking / season / family)', () => {
  it('displays the parking information', async () => {
    mockFetch(buildPayload(fullTrail))
    render(<TrailCardDetails {...props} />)
    expect(await screen.findByTestId('trail-parking')).toHaveTextContent(
      'Parking gratuit au Pont du Diable, 30 places',
    )
  })

  it('displays the recommended seasons with French labels', async () => {
    mockFetch(buildPayload(fullTrail))
    render(<TrailCardDetails {...props} />)
    const season = await screen.findByTestId('trail-season')
    expect(season).toHaveTextContent('Été')
    expect(season).toHaveTextContent('Automne')
  })

  it('flags pets accepted when pets_friendly is true', async () => {
    mockFetch(buildPayload(fullTrail))
    render(<TrailCardDetails {...props} />)
    expect(await screen.findByTestId('trail-pets')).toHaveTextContent(/animaux/i)
  })

  it('flags family friendly when kids_friendly is true', async () => {
    mockFetch(buildPayload(fullTrail))
    render(<TrailCardDetails {...props} />)
    expect(await screen.findByTestId('trail-kids')).toHaveTextContent(/enfant|famille/i)
  })

  it('omits the pratical info when none of the fields are present', async () => {
    const bare: TrailDetailData = {
      ...fullTrail,
      parking_info: null,
      kids_friendly: null,
      pets_friendly: null,
      best_season: [],
    }
    mockFetch(buildPayload(bare))
    render(<TrailCardDetails {...props} />)
    await screen.findByTestId('trail-details')
    expect(screen.queryByTestId('trail-parking')).not.toBeInTheDocument()
    expect(screen.queryByTestId('trail-season')).not.toBeInTheDocument()
    expect(screen.queryByTestId('trail-pets')).not.toBeInTheDocument()
    expect(screen.queryByTestId('trail-kids')).not.toBeInTheDocument()
  })
})
