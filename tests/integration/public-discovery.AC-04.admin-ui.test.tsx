/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminPoiDetailPage from '@/app/admin/pois/[id]/page'
import AdminPoisPage from '@/app/admin/pois/page'
import { AdminPoiDiscoveryCard } from '@/features/admin-pois/components/AdminPoiDiscoveryCard'
import type { AdminPoiDiscoveryEligibility } from '@/features/admin-pois/types'

const mockRefresh = jest.fn()
const mockListAdminPois = jest.fn()
const mockGetAdminPoi = jest.fn()
const mockGetAdminPoiOptions = jest.fn()

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
  useRouter: () => ({ refresh: mockRefresh }),
}))

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

const completeEligibility: AdminPoiDiscoveryEligibility = {
  eligible: true,
  checks: {
    active: true,
    city: true,
    category: true,
    subcategory: true,
    description: true,
    photo: true,
    address: true,
    geocode: true,
    contact: true,
  },
}

function renderCard(
  overrides: Partial<React.ComponentProps<typeof AdminPoiDiscoveryCard>> = {},
) {
  return render(
    <AdminPoiDiscoveryCard
      poiId={poiId}
      status="DRAFT"
      publishedAt={null}
      publicUrl={null}
      eligibility={completeEligibility}
      {...overrides}
    />,
  )
}

function successfulResponse() {
  return {
    ok: true,
    status: 200,
    json: jest.fn(async () => ({ data: { id: poiId } })),
  } as unknown as Response
}

function deferredResponse() {
  let resolve!: (value: Response) => void
  const promise = new Promise<Response>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

describe('041 AC-04 Admin publication controls', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
    jest.spyOn(window, 'confirm').mockReturnValue(true)
    mockGetAdminPoiOptions.mockResolvedValue({
      cities: [{ id: cityId, name: 'Saint-Gervais', slug: 'saint-gervais' }],
      categories: [{ id: 'cat-1', name: 'Culture', slug: 'culture', subcategories: [] }],
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('AC-04-01: renders the exact status, publication date, public link and all BR-04 checks accessibly', () => {
    const eligibility: AdminPoiDiscoveryEligibility = {
      eligible: false,
      checks: { ...completeEligibility.checks, photo: false, contact: false },
    }

    renderCard({
      status: 'PUBLISHED',
      publishedAt: '2026-08-20T15:00:00.000Z',
      publicUrl: '/decouvrir/saint-gervais/culture/le-musee',
      eligibility,
    })

    expect(screen.getByRole('heading', { name: 'Découverte publique' })).toBeInTheDocument()
    expect(screen.getByText('Publié', { selector: '[data-slot="badge"]' })).toBeInTheDocument()
    expect(screen.getByText(/20 août 2026/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Voir la fiche publique/i })).toHaveAttribute(
      'href',
      '/decouvrir/saint-gervais/culture/le-musee',
    )

    const checklist = screen.getByRole('list', { name: 'Checklist de publication' })
    for (const label of [
      'POI actif',
      'Ville active',
      'Catégorie active',
      'Sous-catégorie active (si renseignée)',
      'Description',
      'Photo exploitable',
      'Adresse',
      'Géocodage',
      'Contact',
    ]) {
      expect(within(checklist).getByText(label)).toBeInTheDocument()
    }
    expect(within(checklist).getByLabelText('Photo exploitable : manquant')).toBeInTheDocument()
    expect(within(checklist).getByLabelText('Description : satisfait')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retirer de Découvrir' })).toBeEnabled()
  })

  it('AC-04-01/03: keeps missing checks visible and disables publication for an ineligible draft', () => {
    renderCard({
      eligibility: {
        eligible: false,
        checks: { ...completeEligibility.checks, description: false },
      },
    })

    expect(screen.getByText('Brouillon', { selector: '[data-slot="badge"]' })).toBeInTheDocument()
    expect(screen.getByLabelText('Description : manquant')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publier dans Découvrir' })).toBeDisabled()
    expect(screen.queryByRole('link', { name: /Voir la fiche publique/i })).not.toBeInTheDocument()
  })

  it('AC-04-02: confirms and publishes with the strict PATCH payload, blocks duplicates while pending, then refreshes', async () => {
    const deferred = deferredResponse()
    const fetchMock = jest.mocked(global.fetch).mockReturnValue(deferred.promise)
    renderCard()

    fireEvent.click(screen.getByRole('button', { name: 'Publier dans Découvrir' }))

    expect(window.confirm).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(`/api/admin/pois/${poiId}/discovery-publication`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PUBLISHED' }),
    })
    expect(screen.getByRole('button', { name: 'Publication en cours…' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Publication en cours…' }))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(mockRefresh).not.toHaveBeenCalled()

    deferred.resolve(successfulResponse())
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
    expect(screen.getByText('Brouillon', { selector: '[data-slot="badge"]' })).toBeInTheDocument()
  })

  it('AC-04-04: confirms and unpublishes with the strict PATCH payload', async () => {
    const fetchMock = jest.mocked(global.fetch).mockResolvedValue(successfulResponse())
    renderCard({
      status: 'PUBLISHED',
      publishedAt: '2026-08-20T15:00:00.000Z',
      publicUrl: '/decouvrir/saint-gervais/culture/le-musee',
    })

    fireEvent.click(screen.getByRole('button', { name: 'Retirer de Découvrir' }))

    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith(`/api/admin/pois/${poiId}/discovery-publication`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DRAFT' }),
    })
  })

  it('does not call the API when either publication confirmation is cancelled', () => {
    jest.mocked(window.confirm).mockReturnValue(false)
    const fetchMock = jest.mocked(global.fetch)
    const { rerender } = renderCard()

    fireEvent.click(screen.getByRole('button', { name: 'Publier dans Découvrir' }))
    rerender(
      <AdminPoiDiscoveryCard
        poiId={poiId}
        status="PUBLISHED"
        publishedAt="2026-08-20T15:00:00.000Z"
        publicUrl="/decouvrir/saint-gervais/culture/le-musee"
        eligibility={completeEligibility}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Retirer de Découvrir' }))

    expect(window.confirm).toHaveBeenCalledTimes(2)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('AC-04-03: displays the standard 409 API message accessibly without refreshing', async () => {
    jest.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 409,
      json: jest.fn(async () => ({
        error: {
          code: 'DISCOVERY_PUBLICATION_INCOMPLETE',
          message: 'La fiche doit être complétée avant publication.',
          details: { missing: ['photo'] },
        },
      })),
    } as unknown as Response)
    renderCard()

    fireEvent.click(screen.getByRole('button', { name: 'Publier dans Découvrir' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La fiche doit être complétée avant publication.',
    )
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it.each([
    ['une erreur réseau', () => Promise.reject(new Error('offline'))],
    [
      'une réponse JSON invalide',
      () => Promise.resolve({ ok: false, status: 500, json: () => Promise.reject(new SyntaxError()) } as Response),
    ],
  ])('survit à %s et affiche une erreur accessible', async (_label, responseFactory) => {
    jest.mocked(global.fetch).mockImplementation(responseFactory)
    renderCard()

    fireEvent.click(screen.getByRole('button', { name: 'Publier dans Découvrir' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La mise à jour de la publication a échoué. Veuillez réessayer.',
    )
    expect(mockRefresh).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Publier dans Découvrir' })).toBeEnabled()
  })

  it('AC-04-01: wires the server publication DTO beside the existing edit form', async () => {
    mockGetAdminPoi.mockResolvedValue(buildPoi({ discovery_status: 'DRAFT' }))

    render(await AdminPoiDetailPage({ params: Promise.resolve({ id: poiId }) }))

    expect(screen.getByRole('heading', { name: 'Découverte publique' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Le Musée')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publier dans Découvrir' })).toBeEnabled()
  })

  it('AC-04-06: preserves list filters and paging, and renders accessible discovery badges', async () => {
    mockListAdminPois.mockResolvedValue({
      data: [
        buildPoi({ id: 'poi-draft', name: 'POI brouillon', discovery_status: 'DRAFT' }),
        buildPoi({ id: 'poi-published', name: 'POI publié', discovery_status: 'PUBLISHED' }),
      ],
      pagination: { page: 3, limit: 50, total: 102, total_pages: 3 },
      kpis: {
        active_count: 2,
        inactive_count: 0,
        archived_count: 0,
        without_photos_count: 0,
        pending_geocode_count: 0,
      },
      acquisition_runs: [],
    })

    render(await AdminPoisPage({
      searchParams: Promise.resolve({
        city_id: cityId,
        q: 'musée',
        status: 'active',
        discovery_status: 'PUBLISHED',
        page: '3',
        limit: '50',
      }),
    }))

    expect(mockListAdminPois).toHaveBeenCalledWith(expect.objectContaining({
      city_id: cityId,
      q: 'musée',
      status: 'active',
      discovery_status: 'PUBLISHED',
      page: 3,
      limit: 50,
    }))
    expect(screen.getByLabelText('Découverte')).toHaveAttribute('name', 'discovery_status')
    expect(screen.getByLabelText('Découverte')).toHaveValue('PUBLISHED')
    expect(screen.getByDisplayValue('3')).toHaveAttribute('name', 'page')
    expect(screen.getByDisplayValue('50')).toHaveAttribute('name', 'limit')
    expect(screen.getByLabelText('POI brouillon — Découverte : Brouillon')).toBeInTheDocument()
    expect(screen.getByLabelText('POI publié — Découverte : Publié')).toBeInTheDocument()
  })
})

function buildPoi(overrides: Record<string, unknown> = {}) {
  return {
    id: poiId,
    name: 'Le Musée',
    slug: 'le-musee',
    status: 'active',
    city: { id: cityId, name: 'Saint-Gervais', slug: 'saint-gervais' },
    category: { id: 'cat-1', name: 'Culture', slug: 'culture' },
    subcategory: null,
    address: '1 rue du Musée',
    description: 'Un musée local.',
    phone: '+33 4 50 00 00 00',
    website: 'https://example.com',
    photos: ['https://example.com/photo.jpg'],
    tags: [],
    latitude: 45.89,
    longitude: 6.71,
    geocode_status: 'success',
    photo_count: 1,
    primary_photo_url: null,
    photos_status: 'fresh',
    review_source: 'MANUAL',
    merchant_attached: false,
    has_trail_detail: false,
    updated_at: '2026-08-20T15:00:00.000Z',
    public_url: null,
    slug_editable: false,
    trail_fields_locked: false,
    trail_detail: null,
    discovery_status: 'DRAFT',
    discovery_published_at: null,
    discovery_eligibility: completeEligibility,
    discovery_public_url: null,
    ...overrides,
  }
}
