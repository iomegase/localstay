/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminPathLayout from '@/app/admin/layout'
import AdminPoisPage from '@/app/admin/pois/page'
import AdminPoiDetailPage from '@/app/admin/pois/[id]/page'

const mockListAdminPois = jest.fn()
const mockGetAdminPoi = jest.fn()
const mockGetAdminPoiOptions = jest.fn()

jest.mock('@/features/merchant/lib/get-page-admin', () => ({
  getPageAdmin: jest.fn(async () => ({ id: 'admin-1', role: 'admin' })),
}))

jest.mock('@/features/admin-pois/queries/admin-pois', () => ({
  listAdminPois: (...args: unknown[]) => mockListAdminPois(...args),
  getAdminPoi: (...args: unknown[]) => mockGetAdminPoi(...args),
  getAdminPoiOptions: (...args: unknown[]) => mockGetAdminPoiOptions(...args),
}))

const cityId = '11111111-1111-4111-8111-111111111111'
const poiId = '44444444-4444-4444-8444-444444444444'

function options() {
  return {
    cities: [{ id: cityId, name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' }],
    categories: [
      {
        id: 'cat-1',
        name: 'Culture',
        slug: 'culture',
        subcategories: [{ id: 'sub-1', name: 'Musées', slug: 'musees' }],
      },
    ],
  }
}

describe('022 admin POI pages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAdminPoiOptions.mockResolvedValue(options())
    mockListAdminPois.mockResolvedValue({
      data: [
        {
          id: poiId,
          name: 'Le Pile Pont Expo',
          slug: 'le-pile-pont-expo',
          status: 'active',
          city: { id: cityId, name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' },
          category: { id: 'cat-1', name: 'Culture', slug: 'culture' },
          subcategory: { id: 'sub-1', name: 'Musées', slug: 'musees' },
          address: '74170 Saint-Gervais-les-Bains',
          geocode_status: 'success',
          photo_count: 3,
          primary_photo_url: 'https://example.com/photo.jpg',
          review_source: 'MANUAL',
          merchant_attached: true,
          has_trail_detail: false,
          updated_at: '2026-05-25T08:00:00.000Z',
          public_url: '/guide/saint-gervais-les-bains/culture/le-pile-pont-expo',
        },
      ],
      pagination: { page: 1, limit: 25, total: 1, total_pages: 1 },
      kpis: {
        active_count: 1,
        inactive_count: 0,
        archived_count: 0,
        without_photos_count: 0,
        pending_geocode_count: 0,
      },
      acquisition_runs: [
        {
          id: 'run-1',
          status: 'completed',
          category_name: 'Culture',
          candidate_count: 3,
          needs_review_count: 1,
          published_count: 2,
          created_at: '2026-05-25T08:00:00.000Z',
        },
      ],
    })
    mockGetAdminPoi.mockResolvedValue({
      id: poiId,
      name: 'Le Pile Pont Expo',
      slug: 'le-pile-pont-expo',
      status: 'active',
      city: { id: cityId, name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' },
      category: { id: 'cat-1', name: 'Culture', slug: 'culture' },
      subcategory: { id: 'sub-1', name: 'Musées', slug: 'musees' },
      address: '74170 Saint-Gervais-les-Bains',
      description: 'Exposition locale',
      phone: '+33 4 50 00 00 00',
      website: 'https://www.saintgervais.com/pile-pont-expo',
      photos: ['https://example.com/photo.jpg'],
      tags: ['culture'],
      latitude: 45.89,
      longitude: 6.71,
      geocode_status: 'success',
      photo_count: 1,
      primary_photo_url: 'https://example.com/photo.jpg',
      review_source: 'MANUAL',
      merchant_attached: true,
      has_trail_detail: true,
      updated_at: '2026-05-25T08:00:00.000Z',
      public_url: '/guide/saint-gervais-les-bains/culture/le-pile-pont-expo',
      slug_editable: false,
      trail_fields_locked: true,
    })
  })

  it('adds the POI management link to the admin shell', () => {
    render(<AdminPathLayout><div>Contenu</div></AdminPathLayout>)

    expect(screen.getAllByRole('link', { name: /POI par ville/i })[0]).toHaveAttribute('href', '/admin/pois')
  })

  it('AC-01-01/05-01: renders city selector, KPIs, filters, POI table and acquisition context', async () => {
    render(await AdminPoisPage({ searchParams: Promise.resolve({ city_id: cityId }) }))

    expect(screen.getByText('Backoffice POI')).toBeInTheDocument()
    expect(screen.getByLabelText('Ville')).toBeInTheDocument()
    expect(screen.getAllByText('Actifs').length).toBeGreaterThan(0)
    expect(screen.getByRole('textbox', { name: 'Recherche' })).toBeInTheDocument()
    expect(screen.getByText('Le Pile Pont Expo')).toBeInTheDocument()
    expect(screen.getByText('Runs acquisition')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Revoir/i })).toHaveAttribute('href', '/admin/poi-acquisition/runs/run-1')
  })

  it('AC-01-04: renders an empty state with acquisition and creation CTAs', async () => {
    mockListAdminPois.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 25, total: 0, total_pages: 0 },
      kpis: {
        active_count: 0,
        inactive_count: 0,
        archived_count: 0,
        without_photos_count: 0,
        pending_geocode_count: 0,
      },
      acquisition_runs: [],
    })

    render(await AdminPoisPage({ searchParams: Promise.resolve({ city_id: cityId }) }))

    expect(screen.getByText('Aucun POI publié pour cette ville')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Lancer acquisition/i })[0]).toHaveAttribute(
      'href',
      `/admin/poi-acquisition?city_id=${cityId}`,
    )
    expect(screen.getAllByRole('link', { name: /Créer POI/i })[0]).toHaveAttribute('href', `/admin/pois/new?city_id=${cityId}`)
  })

  it('AC-02-01/04-06: renders detail fields, readonly slug, trail lock and sensitive confirmations', async () => {
    render(await AdminPoiDetailPage({ params: Promise.resolve({ id: poiId }) }))

    expect(screen.getByDisplayValue('Le Pile Pont Expo')).toBeInTheDocument()
    expect(screen.getByDisplayValue('le-pile-pont-expo')).toHaveAttribute('readOnly')
    expect(screen.getByText(/Données parcours verrouillées ici/i)).toBeInTheDocument()
    expect(screen.getByText('Merchant lié')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Désactiver/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Archiver/i })).toBeInTheDocument()
  })
})
