/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminPoisPage from '@/app/admin/pois/page'

jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/pois',
  useRouter: () => ({ replace: jest.fn(), refresh: jest.fn(), push: jest.fn() }),
}))

const mockListAdminPois = jest.fn()

jest.mock('@/features/merchant/lib/get-page-admin', () => ({
  getPageAdmin: jest.fn(async () => ({ id: 'admin-1', role: 'admin' })),
}))

jest.mock('@/features/admin-pois/queries/admin-pois', () => ({
  listAdminPois: (...args: unknown[]) => mockListAdminPois(...args),
  // Spec 069 : comptages du menu catégories (vides ici).
  getAdminPoiTaxonomyCounts: jest.fn(async () => ({ total: 0, categories: [] })),
  getAdminPoi: jest.fn(),
  getAdminPoiOptions: jest.fn(async () => ({
    cities: [{ id: 'city-1', name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' }],
    categories: [],
  })),
}))

// Spec 065 AC-03-06 : un POI publié sans photo exploitable porte un badge dans l'admin.
function listItem(name: string, overrides: Record<string, unknown>) {
  return {
    id: `${name}-id`,
    name,
    slug: name,
    status: 'active',
    city: { id: 'city-1', name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' },
    category: { id: 'cat-1', name: 'Shopping', slug: 'shopping' },
    subcategory: null,
    address: 'Adresse',
    geocode_status: 'success',
    photo_count: 0,
    primary_photo_url: null,
    has_usable_photo: false,
    photos_status: 'ok',
    review_source: 'MANUAL',
    merchant_attached: false,
    has_trail_detail: false,
    updated_at: '2026-10-06T08:00:00.000Z',
    discovery_status: 'PUBLISHED',
    discovery_published_at: '2026-10-06T08:00:00.000Z',
    public_url: `/decouvrir/saint-gervais-les-bains/shopping/${name}`,
    ...overrides,
  }
}

describe('065 AC-03-06 — badge « Sans photo » dans Admin › POI', () => {
  it('signale uniquement les POI publiés sans photo exploitable', async () => {
    mockListAdminPois.mockResolvedValue({
      data: [
        listItem('blanc-sport', {}),
        listItem('avec-photo', { has_usable_photo: true, photo_count: 1, primary_photo_url: 'https://example.com/a.jpg' }),
        listItem('brouillon', { discovery_status: 'DRAFT', discovery_published_at: null, public_url: null }),
      ],
      pagination: { page: 1, limit: 25, total: 3, total_pages: 1 },
      kpis: { active_count: 3, inactive_count: 0, archived_count: 0, without_photos_count: 2, pending_geocode_count: 0 },
      acquisition_runs: [],
    })

    render(await AdminPoisPage({ searchParams: Promise.resolve({ city_id: 'city-1' }) }))

    const badges = screen.getAllByText('Sans photo')
    expect(badges).toHaveLength(1)
    expect(badges[0]!.closest('tr')).toHaveTextContent('blanc-sport')
  })
})
