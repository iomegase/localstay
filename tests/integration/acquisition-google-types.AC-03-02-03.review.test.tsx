/**
 * @jest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminPoiAcquisitionRunPage from '@/app/admin/poi-acquisition/runs/[id]/page'

jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/poi-acquisition',
  useRouter: () => ({ replace: jest.fn(), refresh: jest.fn(), push: jest.fn() }),
  notFound: jest.fn(),
}))
jest.mock('@/features/merchant/lib/get-page-admin', () => ({ getPageAdmin: jest.fn(async () => ({ id: 'admin-1', role: 'admin' })) }))
const mockGetRun = jest.fn()
jest.mock('@/features/poi-acquisition/queries/runs', () => ({ getAcquisitionRun: (...args: unknown[]) => mockGetRun(...args) }))
jest.mock('@/features/poi-acquisition/queries/manual-poi', () => ({ getManualPoiFormOptions: jest.fn(async () => ({ cities: [], categories: [] })) }))

// Spec 073 — revue triée par correspondance de type.
function candidate(id: string, primary_type: string | null, type_match: string | null) {
  return {
    id, name: id, address: `${id} rue`, source: 'google_places', match_status: 'matched', geocode_status: 'success',
    review_status: 'needs_review', duplicate_poi_ids: [], google_place_id: `gp-${id}`, google_review_payload: null,
    business_status: 'OPERATIONAL', phone: null, website: null, description: null, category_id: 'cat-cafes',
    subcategory_id: null, primary_type, type_match,
  }
}

function run(candidates: unknown[]) {
  return {
    id: 'run-1', status: 'completed', error: null, city_name: 'Saint-Gervais-les-Bains', category_name: 'Cafés',
    skipped_other_village: 0, skipped_closed_permanently: 0, skipped_rejected: 0, skipped_excluded: 0,
    excluded_candidates: 0, pending_count: 0, processed_count: candidates.length, candidates,
  }
}

describe('073 AC-03-02 / AC-03-03 — revue', () => {
  it('primary / unknown d’abord, secondary repliés dans « Autres types (N) », badge de type', async () => {
    mockGetRun.mockResolvedValue(run([
      candidate('Le Bistrot', 'french_restaurant', 'secondary'),
      candidate('Café du Mont', 'cafe', 'primary'),
      candidate('Sans type', null, 'unknown'),
      candidate('Le Pub', 'bar', 'secondary'),
    ]))

    const { container } = render(await AdminPoiAcquisitionRunPage({ params: Promise.resolve({ id: 'run-1' }) }))

    const details = container.querySelector('details')!
    expect(details).not.toHaveAttribute('open')
    expect(within(details).getByText('Autres types (2)')).toBeInTheDocument()
    expect(within(details).getAllByRole('heading').map(heading => heading.textContent)).toEqual(['Le Bistrot', 'Le Pub'])

    const mainHeadings = screen.getAllByRole('heading', { level: 3 })
      .filter(heading => !details.contains(heading))
      .map(heading => heading.textContent)
    expect(mainHeadings).toEqual(['Café du Mont', 'Sans type'])

    expect(screen.getByText('Type : Café')).toBeInTheDocument()
    expect(screen.getByText('Type : Type inconnu')).toBeInTheDocument()
    expect(within(details).getByText('Type : Restaurant français')).toBeInTheDocument()
  })

  it('candidats d’avant la migration (sans correspondance) : pas de section ni de badge', async () => {
    mockGetRun.mockResolvedValue(run([candidate('Ancien', null, null)]))

    const { container } = render(await AdminPoiAcquisitionRunPage({ params: Promise.resolve({ id: 'run-1' }) }))

    expect(container.querySelector('details')).toBeNull()
    expect(screen.queryByText(/^Type :/)).toBeNull()
  })
})
