/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminPoiAcquisitionRunPage from '@/app/admin/poi-acquisition/runs/[id]/page'
import { AdminCandidateReviewActions } from '@/features/poi-acquisition/components/AdminCandidateReviewActions'
import { AdminCandidateEditDialog } from '@/features/poi-acquisition/components/AdminCandidateEditDialog'
import { AdminReviewMemoryList } from '@/features/poi-acquisition/components/AdminReviewMemoryList'

jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/poi-acquisition',
  useRouter: () => ({ replace: jest.fn(), refresh: jest.fn(), push: jest.fn() }),
  notFound: jest.fn(),
}))
jest.mock('@/features/merchant/lib/get-page-admin', () => ({ getPageAdmin: jest.fn(async () => ({ id: 'admin-1', role: 'admin' })) }))
const mockGetRun = jest.fn()
jest.mock('@/features/poi-acquisition/queries/runs', () => ({ getAcquisitionRun: (...args: unknown[]) => mockGetRun(...args) }))
jest.mock('@/features/poi-acquisition/queries/manual-poi', () => ({
  getManualPoiFormOptions: jest.fn(async () => ({ cities: [], categories })),
}))

// Spec 071 — écrans de revue.
const categories = [
  { id: 'cat-diner', name: 'Restaurant', subcategories: [{ id: 'sub-resto', name: 'Restaurants' }] },
  { id: 'cat-shop', name: 'Shopping', subcategories: [{ id: 'sub-bout', name: 'Boutiques locales' }, { id: 'sub-ski', name: 'Location de ski' }] },
]
const candidate = {
  id: 'cand-1', name: 'Maison des Alpes', address: '71 Av. du Mont d’Arbois', source: 'google_places',
  match_status: 'matched', geocode_status: 'success', review_status: 'needs_review', duplicate_poi_ids: [],
  google_place_id: 'gp-1', google_review_payload: null, business_status: 'OPERATIONAL',
  phone: null, website: null, description: 'Boutique', category_id: 'cat-diner', subcategory_id: null,
}

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

beforeEach(() => {
  jest.clearAllMocks()
  window.confirm = jest.fn(() => true)
  Object.defineProperty(window, 'location', { value: { reload: jest.fn(), assign: jest.fn() }, writable: true })
  global.fetch = jest.fn(async () => jsonResponse({ data: {} })) as jest.Mock
})

describe('071 AC-04-01 — résumé du run', () => {
  it('indique les lieux déjà rejetés, exclus et les candidats exclus masqués', async () => {
    mockGetRun.mockResolvedValue({
      id: 'run-1', status: 'completed', error: null, city_name: 'Saint-Gervais-les-Bains', category_name: 'Restaurant',
      skipped_other_village: 0, skipped_closed_permanently: 0, skipped_rejected: 1, skipped_excluded: 2, excluded_candidates: 1,
      candidates: [candidate],
    })

    render(await AdminPoiAcquisitionRunPage({ params: Promise.resolve({ id: 'run-1' }) }))

    expect(screen.getByText('1 lieu déjà rejeté pour cette catégorie')).toBeInTheDocument()
    expect(screen.getByText('2 lieux exclus')).toBeInTheDocument()
    expect(screen.getByText('1 candidat exclu masqué')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exclure' })).toBeInTheDocument()
  })
})

describe('071 AC-03-01 — Exclure', () => {
  it('demande confirmation puis exclut', async () => {
    render(<AdminCandidateReviewActions candidateId="cand-1" reviewStatus="needs_review" duplicatePoiIds={[]} />)

    fireEvent.click(screen.getByRole('button', { name: 'Exclure' }))

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('ne sera plus proposé'))
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/admin/poi-acquisition/candidates/cand-1/exclude', expect.objectContaining({ method: 'POST' })))
  })

  it('annuler la confirmation ne fait rien', () => {
    window.confirm = jest.fn(() => false)
    render(<AdminCandidateReviewActions candidateId="cand-1" reviewStatus="needs_review" duplicatePoiIds={[]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Exclure' }))
    expect(global.fetch).not.toHaveBeenCalled()
  })
})

describe('071 US-01 — Modifier', () => {
  it('AC-01-01 : reclasse le candidat dans une autre catégorie et sous-catégorie', async () => {
    render(<AdminCandidateEditDialog candidate={candidate} categories={categories} />)

    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }))
    const dialog = await screen.findByRole('dialog', { name: 'Modifier le candidat' })
    fireEvent.change(within(dialog).getByLabelText('Catégorie'), { target: { value: 'cat-shop' } })
    expect(within(within(dialog).getByLabelText('Sous-catégorie')).getAllByRole('option').map(option => option.textContent))
      .toEqual(['Aucune', 'Boutiques locales', 'Location de ski'])
    fireEvent.change(within(dialog).getByLabelText('Sous-catégorie'), { target: { value: 'sub-bout' } })
    fireEvent.change(within(dialog).getByLabelText('Téléphone'), { target: { value: '04 50 00 00 00' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0]!
    expect(url).toBe('/api/admin/poi-acquisition/candidates/cand-1')
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body)).toEqual({
      name: 'Maison des Alpes', address: '71 Av. du Mont d’Arbois', phone: '04 50 00 00 00', website: null,
      description: 'Boutique', category_id: 'cat-shop', subcategory_id: 'sub-bout',
    })
  })

  it('affiche l’erreur renvoyée par l’API', async () => {
    global.fetch = jest.fn(async () => jsonResponse({ error: { message: 'La sous-catégorie n’appartient pas à la catégorie choisie' } }, 400)) as jest.Mock
    render(<AdminCandidateEditDialog candidate={candidate} categories={categories} />)

    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }))
    const dialog = await screen.findByRole('dialog', { name: 'Modifier le candidat' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('La sous-catégorie n’appartient pas')
  })
})

describe('071 AC-03-03 — Lieux exclus ou rejetés', () => {
  const memories = [
    { id: 'mem-1', kind: 'excluded', name: 'Snack fermé', address: 'Rue A', city: { id: 'c', name: 'Saint-Gervais-les-Bains' }, category: null, created_at: '2026-10-06T08:00:00.000Z' },
    { id: 'mem-2', kind: 'rejected', name: 'Maison des Alpes', address: 'Rue B', city: { id: 'c', name: 'Saint-Gervais-les-Bains' }, category: { id: 'cat-diner', name: 'Restaurant' }, created_at: '2026-10-06T08:00:00.000Z' },
  ]

  it('liste les décisions et permet de réintégrer un lieu', async () => {
    render(<AdminReviewMemoryList memories={memories} />)

    expect(screen.getByRole('listitem', { name: 'Snack fermé' })).toHaveTextContent('Exclu')
    const rejected = screen.getByRole('listitem', { name: 'Maison des Alpes' })
    expect(rejected).toHaveTextContent('Rejeté — Restaurant')

    fireEvent.click(within(rejected).getByRole('button', { name: 'Réintégrer' }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/admin/poi-acquisition/memories/mem-2', { method: 'DELETE' }))
  })

  it('liste vide → message', () => {
    render(<AdminReviewMemoryList memories={[]} />)
    expect(screen.getByText('Aucun lieu exclu ou rejeté.')).toBeInTheDocument()
  })
})
