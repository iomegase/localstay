/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import AdminPoisPage from '@/app/admin/pois/page'
import AdminPoiDetailPage from '@/app/admin/pois/[id]/page'
import AdminPoiPanelPage from '@/app/admin/pois/@panel/(.)[id]/page'
import AdminPoiCreatePanelPage from '@/app/admin/pois/@panel/(.)new/page'
import { AdminManualPoiForm } from '@/features/poi-acquisition/components/AdminManualPoiForm'

const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/pois',
  useRouter: () => ({ replace: mockReplace, refresh: jest.fn(), push: jest.fn(), back: jest.fn() }),
  notFound: jest.fn(() => { throw new Error('NEXT_NOT_FOUND') }),
}))

jest.mock('@/features/merchant/lib/get-page-admin', () => ({
  getPageAdmin: jest.fn(async () => ({ id: 'admin-1', role: 'admin' })),
}))

const mockListAdminPois = jest.fn()
const mockListAdminPoiIds = jest.fn()
const mockGetAdminPoi = jest.fn()
jest.mock('@/features/admin-pois/queries/admin-pois', () => ({
  listAdminPois: (...args: unknown[]) => mockListAdminPois(...args),
  listAdminPoiIds: (...args: unknown[]) => mockListAdminPoiIds(...args),
  getAdminPoi: (...args: unknown[]) => mockGetAdminPoi(...args),
  getAdminPoiOptions: jest.fn(async () => ({
    cities: [{ id: 'city-sg', name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' }],
    categories: [{ id: 'cat-shop', name: 'Shopping', slug: 'shopping', subcategories: [] }],
  })),
}))

jest.mock('@/features/poi-acquisition/queries/manual-poi', () => ({
  getManualPoiFormOptions: jest.fn(async () => ({
    cities: [{ id: 'city-sg', name: 'Saint-Gervais-les-Bains' }],
    categories: [{ id: 'cat-shop', name: 'Shopping', subcategories: [] }],
  })),
}))

// Spec 068 — pages : liste, panneau, pleine page, création.
const search = {
  city_id: 'city-sg',
  q: 'ski',
  category_id: 'cat-shop',
  status: 'current',
  discovery_status: 'ALL',
}
const QUERY = 'city_id=city-sg&q=ski&category_id=cat-shop&status=current&discovery_status=ALL'

const poi = {
  id: 'poi-b',
  name: 'Blanc Sport',
  slug: 'blanc-sport',
  status: 'active',
  city: { id: 'city-sg', name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' },
  category: { id: 'cat-shop', name: 'Shopping', slug: 'shopping' },
  subcategory: null,
  address: '1 rue du Mont-Blanc',
  description: 'Loueur de skis.',
  phone: null,
  website: null,
  photos: [],
  tags: [],
  latitude: 45.89,
  longitude: 6.71,
  geocode_status: 'success',
  photo_count: 0,
  primary_photo_url: null,
  has_usable_photo: false,
  photos_status: 'ok',
  review_source: 'MANUAL',
  merchant_attached: false,
  has_trail_detail: false,
  trail_detail: null,
  updated_at: '2026-10-06T08:00:00.000Z',
  discovery_status: 'PUBLISHED',
  discovery_published_at: '2026-10-06T08:00:00.000Z',
  public_url: '/decouvrir/saint-gervais-les-bains/shopping/blanc-sport',
  slug_editable: false,
  trail_fields_locked: false,
  discovery_eligibility: {
    eligible: true,
    checks: {
      active: true, city: true, category: true, subcategory: true, description: true,
      photo: true, address: true, geocode: true, contact: true,
    },
  },
  discovery_public_url: '/decouvrir/saint-gervais-les-bains/shopping/blanc-sport',
}

describe('068 — liste POI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockListAdminPois.mockResolvedValue({
      data: [poi],
      pagination: { page: 1, limit: 25, total: 1, total_pages: 1 },
      kpis: { active_count: 1, inactive_count: 0, archived_count: 0, without_photos_count: 1, pending_geocode_count: 0 },
      acquisition_runs: [],
    })
  })

  it('AC-01-01 / BR-03 : « Éditer » et le nom ouvrent la fiche en gardant les filtres', async () => {
    render(await AdminPoisPage({ searchParams: Promise.resolve(search) }))

    const row = screen.getByRole('row', { name: /Blanc Sport/ })
    expect(within(row).getByRole('link', { name: 'Éditer' })).toHaveAttribute('href', `/admin/pois/poi-b?${QUERY}`)
    expect(within(row).getByRole('link', { name: 'Blanc Sport' })).toHaveAttribute('href', `/admin/pois/poi-b?${QUERY}`)
  })

  it('AC-05-01 : « Créer POI » ouvre la création avec les filtres', async () => {
    render(await AdminPoisPage({ searchParams: Promise.resolve(search) }))

    expect(screen.getByRole('link', { name: /Créer POI/ })).toHaveAttribute('href', `/admin/pois/new?${QUERY}`)
  })

  it('AC-06-01 : un interrupteur de publication par ligne', async () => {
    render(await AdminPoisPage({ searchParams: Promise.resolve(search) }))

    expect(screen.getByRole('switch', { name: 'Blanc Sport — Publié sur Découvrir' })).toBeChecked()
  })
})

describe('068 — fiche dans le panneau', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAdminPoi.mockResolvedValue(poi)
    mockListAdminPoiIds.mockResolvedValue(['poi-a', 'poi-b', 'poi-c'])
  })

  it('AC-01-01 / AC-01-04 / AC-04-01 : panneau titré, en-tête, onglets et position', async () => {
    render(await AdminPoiPanelPage({
      params: Promise.resolve({ id: 'poi-b' }),
      searchParams: Promise.resolve(search),
    }))

    const dialog = screen.getByRole('dialog', { name: 'Blanc Sport' })
    expect(within(dialog).getByText('2 / 3')).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: /Voir public/ })).toHaveAttribute(
      'href', '/decouvrir/saint-gervais-les-bains/shopping/blanc-sport',
    )
    const tabs = within(dialog).getByRole('navigation', { name: 'Sections de la fiche' })
    expect(within(tabs).getAllByRole('button').map(button => button.textContent)).toEqual([
      'Identité', 'Lieu', 'Photos', 'Publication',
    ])
    expect(within(dialog).getByLabelText('Nom')).toHaveValue('Blanc Sport')
    expect(dialog.querySelector('#poi-section-publication')).not.toBeNull()
    expect(mockListAdminPoiIds).toHaveBeenCalledWith(expect.objectContaining({ city_id: 'city-sg', q: 'ski' }))
  })

  it('AC-01-04 : onglet Randonnée pour une fiche avec tracé', async () => {
    mockGetAdminPoi.mockResolvedValue({
      ...poi,
      has_trail_detail: true,
      trail_detail: {
        difficulty: 'medium', distance_km: 8, elevation_gain_m: 500, estimated_duration_min: 180,
        geometry_geojson: null, start_latitude: null, start_longitude: null, data_quality_status: 'ok',
      },
    })

    render(await AdminPoiPanelPage({
      params: Promise.resolve({ id: 'poi-b' }),
      searchParams: Promise.resolve(search),
    }))

    const tabs = screen.getByRole('navigation', { name: 'Sections de la fiche' })
    expect(within(tabs).getAllByRole('button').map(button => button.textContent)).toContain('Randonnée')
  })

  it('POI introuvable → 404', async () => {
    mockGetAdminPoi.mockResolvedValue(null)

    await expect(AdminPoiPanelPage({
      params: Promise.resolve({ id: 'inconnu' }),
      searchParams: Promise.resolve(search),
    })).rejects.toThrow('NEXT_NOT_FOUND')
  })
})

describe('068 — fiche pleine page', () => {
  it('AC-02-03 : « Retour aux POI » conserve tous les filtres', async () => {
    mockGetAdminPoi.mockResolvedValue(poi)

    render(await AdminPoiDetailPage({
      params: Promise.resolve({ id: 'poi-b' }),
      searchParams: Promise.resolve(search),
    }))

    expect(screen.getByRole('link', { name: /Retour aux POI/ })).toHaveAttribute('href', `/admin/pois?${QUERY}`)
  })

  it('BR-02 : sans filtre, retour à la liste de la ville du POI', async () => {
    mockGetAdminPoi.mockResolvedValue(poi)

    render(await AdminPoiDetailPage({
      params: Promise.resolve({ id: 'poi-b' }),
      searchParams: Promise.resolve({}),
    }))

    expect(screen.getByRole('link', { name: /Retour aux POI/ })).toHaveAttribute('href', '/admin/pois?city_id=city-sg')
  })
})

describe('068 US-05 — création dans le panneau', () => {
  beforeEach(() => jest.clearAllMocks())

  it('AC-05-01 : formulaire de création dans le panneau, ville pré-remplie', async () => {
    render(await AdminPoiCreatePanelPage({ searchParams: Promise.resolve(search) }))

    const dialog = screen.getByRole('dialog', { name: 'Créer un POI' })
    expect(within(dialog).getByLabelText('Ville')).toHaveValue('city-sg')
  })

  it('AC-05-02 : après création, ouvre la fiche du nouveau POI dans le panneau', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true, status: 201, json: async () => ({ data: { id: 'poi-new' } }),
    })) as jest.Mock
    render(await AdminPoiCreatePanelPage({ searchParams: Promise.resolve(search) }))

    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Le Galeta' } })
    fireEvent.change(screen.getByLabelText('Adresse'), { target: { value: '150 Imp. des Lupins' } })
    fireEvent.click(screen.getByRole('button', { name: 'Créer après validation' }))

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(`/admin/pois/poi-new?${QUERY}`, { scroll: false }))
  })

  it('le formulaire hors panneau garde sa navigation pleine page', async () => {
    const assign = jest.fn()
    Object.defineProperty(window, 'location', { value: { assign }, writable: true })
    global.fetch = jest.fn(async () => ({
      ok: true, status: 201, json: async () => ({ data: { id: 'poi-new' } }),
    })) as jest.Mock
    render(<AdminManualPoiForm cities={[{ id: 'city-sg', name: 'Saint-Gervais' }]} categories={[{ id: 'cat', name: 'Shopping', subcategories: [] }]} />)

    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Le Galeta' } })
    fireEvent.change(screen.getByLabelText('Adresse'), { target: { value: '150 Imp. des Lupins' } })
    fireEvent.click(screen.getByRole('button', { name: 'Créer après validation' }))

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/admin/pois/poi-new'))
  })
})

describe('068 — routes interceptées', () => {
  it('le slot @panel a un état par défaut vide et les deux interceptions', () => {
    const root = join(process.cwd(), 'src/app/admin/pois')
    expect(existsSync(join(root, 'layout.tsx'))).toBe(true)
    expect(existsSync(join(root, '@panel/default.tsx'))).toBe(true)
    expect(existsSync(join(root, '@panel/(.)[id]/page.tsx'))).toBe(true)
    expect(existsSync(join(root, '@panel/(.)new/page.tsx'))).toBe(true)
  })
})
