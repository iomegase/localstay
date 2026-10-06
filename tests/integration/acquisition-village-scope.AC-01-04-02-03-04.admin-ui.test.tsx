/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminPoiAcquisitionRunPage from '@/app/admin/poi-acquisition/runs/[id]/page'
import { AdminPlaceByNameSearch } from '@/features/poi-acquisition/components/AdminPlaceByNameSearch'

jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/poi-acquisition',
  useRouter: () => ({ replace: jest.fn(), refresh: jest.fn(), push: jest.fn() }),
  notFound: jest.fn(),
}))

jest.mock('@/features/merchant/lib/get-page-admin', () => ({
  getPageAdmin: jest.fn(async () => ({ id: 'admin-1', role: 'admin' })),
}))

// Spec 071 : options de catégorie de la fenêtre « Modifier ».
jest.mock('@/features/poi-acquisition/queries/manual-poi', () => ({
  getManualPoiFormOptions: jest.fn(async () => ({ cities: [], categories: [] })),
}))
const mockGetAcquisitionRun = jest.fn()
jest.mock('@/features/poi-acquisition/queries/runs', () => ({
  getAcquisitionRun: (...args: unknown[]) => mockGetAcquisitionRun(...args),
}))

// Spec 066 — écrans admin d'acquisition.
function candidate(name: string, business_status: string | null) {
  return {
    id: `cand-${name}`, name, address: 'Adresse', source: 'google_places',
    match_status: 'matched', geocode_status: 'success', review_status: 'needs_review',
    duplicate_poi_ids: [], google_place_id: name, google_review_payload: null, business_status,
  }
}

describe('066 — détail d’un run', () => {
  it('AC-01-04 / AC-02-02 : résume les lieux ignorés', async () => {
    mockGetAcquisitionRun.mockResolvedValue({
      id: 'run-1', status: 'completed', error: null,
      city_name: 'Saint-Gervais-les-Bains', category_name: 'Dîner',
      skipped_other_village: 4, skipped_closed_permanently: 2,
      candidates: [candidate('le-terrier', 'OPERATIONAL')],
    })

    render(await AdminPoiAcquisitionRunPage({ params: Promise.resolve({ id: 'run-1' }) }))

    expect(screen.getByText('4 lieux ignorés car plus proches d’un autre village')).toBeInTheDocument()
    expect(screen.getByText('2 lieux ignorés car fermés définitivement')).toBeInTheDocument()
  })

  it('n’affiche pas de résumé quand rien n’a été ignoré', async () => {
    mockGetAcquisitionRun.mockResolvedValue({
      id: 'run-1', status: 'completed', error: null,
      city_name: 'Saint-Gervais-les-Bains', category_name: 'Dîner',
      skipped_other_village: 0, skipped_closed_permanently: 0,
      candidates: [candidate('le-terrier', 'OPERATIONAL')],
    })

    render(await AdminPoiAcquisitionRunPage({ params: Promise.resolve({ id: 'run-1' }) }))

    expect(screen.queryByText(/lieux? ignorés?/)).not.toBeInTheDocument()
  })

  it('AC-02-03 : badge sur un candidat fermé temporairement', async () => {
    mockGetAcquisitionRun.mockResolvedValue({
      id: 'run-1', status: 'completed', error: null,
      city_name: 'Saint-Gervais-les-Bains', category_name: 'Dîner',
      skipped_other_village: 0, skipped_closed_permanently: 0,
      candidates: [candidate('le-terrier', 'OPERATIONAL'), candidate('le-galeta', 'CLOSED_TEMPORARILY')],
    })

    render(await AdminPoiAcquisitionRunPage({ params: Promise.resolve({ id: 'run-1' }) }))

    const badges = screen.getAllByText('Fermé temporairement (souvent saisonnier)')
    expect(badges).toHaveLength(1)
    expect(badges[0]!.closest('tr')).toHaveTextContent('le-galeta')
  })
})

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

describe('066 US-04 — « Ajouter un lieu précis »', () => {
  const cities = [{ id: 'city-sg', name: 'Saint-Gervais-les-Bains' }]
  const categories = [{ id: 'cat-diner', name: 'Dîner' }]
  const assign = jest.fn()

  beforeEach(() => {
    assign.mockReset()
    Object.defineProperty(window, 'location', { value: { assign }, writable: true })
    global.fetch = jest.fn(async (input, init) => {
      const url = String(input)
      if (url === '/api/admin/poi-acquisition/name-search') {
        return jsonResponse({
          data: [
            {
              google_place_id: 'le-galeta', name: 'Restaurant Le Galeta', address: '150 Imp. des Lupins',
              business_status: 'CLOSED_TEMPORARILY',
              nearest_city: { slug: 'saint-gervais-les-bains', name: 'Saint-Gervais-les-Bains' },
              is_other_village: false,
            },
            {
              google_place_id: 'mont-joly', name: 'Bistrot du Mont Joly', address: 'Saint-Nicolas',
              business_status: 'OPERATIONAL',
              nearest_city: { slug: 'saint-nicolas-de-veroce', name: 'Saint-Nicolas-de-Véroce' },
              is_other_village: true,
              memory: { kind: 'excluded', categories: [] },
            },
          ],
        })
      }
      if (url === '/api/admin/poi-acquisition/runs') {
        expect(JSON.parse(String(init?.body))).toEqual({
          city_id: 'city-sg', category_id: 'cat-diner', google_place_id: 'le-galeta',
        })
        return jsonResponse({ data: { id: 'run-9' } }, 201)
      }
      return jsonResponse({}, 404)
    }) as jest.Mock
  })

  it('AC-04-01 / AC-04-03 : affiche statut et avertissement d’un autre village', async () => {
    render(<AdminPlaceByNameSearch cities={cities} categories={categories} />)

    fireEvent.change(screen.getByLabelText('Nom de l’établissement'), { target: { value: 'Le Galeta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Rechercher' }))

    const galeta = await screen.findByRole('listitem', { name: 'Restaurant Le Galeta' })
    expect(within(galeta).getByText('Fermé temporairement')).toBeInTheDocument()
    const montJoly = screen.getByRole('listitem', { name: 'Bistrot du Mont Joly' })
    expect(within(montJoly).getByText('Plus proche de Saint-Nicolas-de-Véroce')).toBeInTheDocument()
    expect(within(galeta).queryByText(/Plus proche de/)).not.toBeInTheDocument()
    // Spec 071 AC-04-02 : badge de mémoire de revue.
    expect(within(montJoly).getByText('Exclu')).toBeInTheDocument()
  })

  it('AC-04-02 : « Ajouter » crée le run du lieu choisi et ouvre sa revue', async () => {
    render(<AdminPlaceByNameSearch cities={cities} categories={categories} />)

    fireEvent.change(screen.getByLabelText('Nom de l’établissement'), { target: { value: 'Le Galeta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Rechercher' }))
    const galeta = await screen.findByRole('listitem', { name: 'Restaurant Le Galeta' })
    fireEvent.click(within(galeta).getByRole('button', { name: 'Ajouter' }))

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/admin/poi-acquisition/runs/run-9'))
  })
})
