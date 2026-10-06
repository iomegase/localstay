/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminPoiAcquisitionRunPage from '@/app/admin/poi-acquisition/runs/[id]/page'
import AdminPoiAcquisitionPage from '@/app/admin/poi-acquisition/page'

jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/poi-acquisition',
  useRouter: () => ({ replace: jest.fn(), refresh: jest.fn(), push: jest.fn() }),
  notFound: jest.fn(),
}))
jest.mock('@/features/merchant/lib/get-page-admin', () => ({ getPageAdmin: jest.fn(async () => ({ id: 'admin-1', role: 'admin' })) }))
const mockGetRun = jest.fn()
const mockListRuns = jest.fn()
jest.mock('@/features/poi-acquisition/queries/runs', () => ({
  getAcquisitionRun: (...args: unknown[]) => mockGetRun(...args),
  listAcquisitionRuns: (...args: unknown[]) => mockListRuns(...args),
}))
jest.mock('@/features/poi-acquisition/queries/manual-poi', () => ({
  getManualPoiFormOptions: jest.fn(async () => ({ cities: [], categories: [] })),
}))
jest.mock('@/features/poi-acquisition/queries/review-memory', () => ({ listReviewMemories: jest.fn(async () => []) }))

// Spec 072 — écrans des lancements partiels.
const run = {
  id: 'run-1', status: 'partial', error: null, city_name: 'Saint-Gervais-les-Bains', category_name: 'Restaurant',
  skipped_other_village: 0, skipped_closed_permanently: 0, skipped_rejected: 0, skipped_excluded: 0,
  excluded_candidates: 0, pending_count: 19, processed_count: 41, candidates: [],
}

describe('072 — lancement partiel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(window, 'location', { value: { reload: jest.fn(), assign: jest.fn() }, writable: true })
    global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({ data: { id: 'run-1', status: 'completed' } }) })) as jest.Mock
  })

  it('AC-02-03 : indique les lieux restants et reprend au clic', async () => {
    mockGetRun.mockResolvedValue(run)
    render(await AdminPoiAcquisitionRunPage({ params: Promise.resolve({ id: 'run-1' }) }))

    expect(screen.getByText('19 lieux restent à traiter (41 déjà traités)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre' }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/admin/poi-acquisition/runs/run-1/resume', { method: 'POST' }))
    await waitFor(() => expect(window.location.reload).toHaveBeenCalled())
  })

  it('pas de bouton « Reprendre » pour un run terminé', async () => {
    mockGetRun.mockResolvedValue({ ...run, status: 'completed', pending_count: 0 })
    render(await AdminPoiAcquisitionRunPage({ params: Promise.resolve({ id: 'run-1' }) }))
    expect(screen.queryByRole('button', { name: 'Reprendre' })).not.toBeInTheDocument()
  })

  it('AC-03-02 : badge « PARTIEL » dans la liste des lancements', async () => {
    mockListRuns.mockResolvedValue([{
      id: 'run-1', status: 'partial', error: null, city_name: 'Saint-Gervais-les-Bains', category_name: 'Restaurant',
      candidate_count: 41, published_count: 0, needs_review_count: 41, created_at: '2026-10-06T08:55:00.000Z',
    }])
    render(await AdminPoiAcquisitionPage())
    expect(screen.getByText('PARTIEL')).toBeInTheDocument()
  })
})
