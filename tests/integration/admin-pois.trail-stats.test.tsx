/**
 * @jest-environment jsdom
 */
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import { AdminPoiEditForm } from '@/features/admin-pois/components/AdminPoiEditForm'
import type { AdminPoiCategory, AdminPoiDetail } from '@/features/admin-pois/types'

// react-markdown est ESM et casse le transform jest ; on neutralise le rendu Markdown.
jest.mock('@/shared/components/MarkdownText', () => ({
  MarkdownText: ({ source }: { source: string }) => <div>{source}</div>,
}))

const categories: AdminPoiCategory[] = [
  {
    id: 'cat-rando',
    name: 'Randonnée',
    slug: 'rando',
    subcategories: [{ id: 'sub-1', name: 'Lacs', slug: 'lacs' }],
  },
]

function buildTrailPoi(trailDetail: AdminPoiDetail['trail_detail']): AdminPoiDetail {
  return {
    id: 'poi-1',
    name: 'Lac de Pormenaz',
    slug: 'lac-de-pormenaz',
    status: 'active',
    city: { id: 'city-1', name: 'Les Contamines', slug: 'les-contamines' },
    category: { id: 'cat-rando', name: 'Randonnée', slug: 'rando' },
    subcategory: { id: 'sub-1', name: 'Lacs', slug: 'lacs' },
    address: 'Sentier du lac',
    geocode_status: 'success',
    photo_count: 0,
    primary_photo_url: null,
    review_source: 'MANUAL',
    merchant_attached: false,
    has_trail_detail: true,
    updated_at: '2026-05-25T08:00:00.000Z',
    public_url: '/guide/les-contamines/rando/lac-de-pormenaz',
    description: null,
    phone: null,
    website: null,
    photos: [],
    tags: [],
    latitude: 45.9,
    longitude: 6.7,
    slug_editable: false,
    trail_fields_locked: true,
    trail_detail: trailDetail,
  }
}

const fullTrail = {
  difficulty: 'medium',
  distance_km: 8.4,
  elevation_gain_m: 950,
  estimated_duration_min: 210,
}

const missingTrail = {
  difficulty: 'unknown',
  distance_km: null,
  elevation_gain_m: null,
  estimated_duration_min: null,
}

afterEach(() => {
  jest.resetAllMocks()
})

describe('AdminPoiEditForm — trail stats (distance / difficulté / durée / dénivelé)', () => {
  it('shows present values read-only, without editable inputs', () => {
    render(<AdminPoiEditForm poi={buildTrailPoi(fullTrail)} categories={categories} />)

    const panel = screen.getByTestId('trail-stats-readonly')
    expect(within(panel).getByText(/8[.,]4\s*km/)).toBeInTheDocument()
    expect(within(panel).getByText(/Modéré/)).toBeInTheDocument()
    expect(within(panel).getByText(/950\s*m/)).toBeInTheDocument()
    expect(within(panel).getByText(/3\s*h\s*30/)).toBeInTheDocument()
    expect(within(panel).queryByLabelText(/Distance \(km\)/i)).not.toBeInTheDocument()
  })

  it('shows an editable input for each missing trail value', () => {
    render(<AdminPoiEditForm poi={buildTrailPoi(missingTrail)} categories={categories} />)

    const panel = screen.getByTestId('trail-stats-readonly')
    expect(within(panel).getByLabelText(/Distance \(km\)/i)).toBeInTheDocument()
    expect(within(panel).getByLabelText(/Difficulté/i)).toBeInTheDocument()
    expect(within(panel).getByLabelText(/Durée \(min\)/i)).toBeInTheDocument()
    expect(within(panel).getByLabelText(/Dénivelé \(m\)/i)).toBeInTheDocument()
  })

  it('submits filled missing values inside a trail_metrics patch', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    })
    global.fetch = fetchMock as unknown as typeof fetch

    render(<AdminPoiEditForm poi={buildTrailPoi(missingTrail)} categories={categories} />)

    const panel = screen.getByTestId('trail-stats-readonly')
    fireEvent.change(within(panel).getByLabelText(/Distance \(km\)/i), { target: { value: '8.4' } })
    fireEvent.change(within(panel).getByLabelText(/Dénivelé \(m\)/i), { target: { value: '950' } })

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    expect(body.trail_metrics).toEqual({ distance_km: 8.4, elevation_gain_m: 950 })
  })
})
