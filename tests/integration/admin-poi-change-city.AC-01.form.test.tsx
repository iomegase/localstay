/**
 * @jest-environment jsdom
 */
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import { AdminPoiEditForm } from '@/features/admin-pois/components/AdminPoiEditForm'
import type { AdminPoiCategory, AdminPoiCity, AdminPoiDetail } from '@/features/admin-pois/types'

jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }))

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

const cities: AdminPoiCity[] = [
  { id: 'city-1', name: 'Les Contamines', slug: 'les-contamines' },
  { id: 'city-passy', name: 'Passy', slug: 'passy' },
]

describe('spec 092 — champ Ville de l’édition admin', () => {
  it('propose les villes actives et envoie city_id uniquement si la ville change', async () => {
    const fetchMock = jest.fn(async () => ({ ok: true, json: async () => ({}) }))
    global.fetch = fetchMock as unknown as typeof fetch
    render(<AdminPoiEditForm poi={buildTrailPoi(null)} categories={categories} cities={cities} />)

    const select = screen.getByLabelText('Ville') as HTMLSelectElement
    expect(select.value).toBe('city-1')
    expect([...select.options].map(option => option.text)).toEqual(['Les Contamines', 'Passy'])

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)).not.toHaveProperty('city_id')

    fireEvent.change(select, { target: { value: 'city-passy' } })
    expect(screen.getByText('Les coordonnées seront recalculées depuis la nouvelle ville à l’enregistrement.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(JSON.parse((fetchMock.mock.calls[1] as unknown as [string, RequestInit])[1].body as string).city_id).toBe('city-passy')
    expect(await screen.findByText('Ville modifiée : coordonnées recalculées, ancienne adresse publique redirigée.')).toBeInTheDocument()
  })
})
