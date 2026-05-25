/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminPathLayout from '@/app/admin/layout'
import AdminPoiAcquisitionPage from '@/app/admin/poi-acquisition/page'
import AdminPoiAcquisitionRunPage from '@/app/admin/poi-acquisition/runs/[id]/page'
import AdminNewPoiPage from '@/app/admin/pois/new/page'

jest.mock('@/features/merchant/lib/get-page-admin', () => ({
  getPageAdmin: jest.fn(async () => ({ id: 'admin-1', role: 'admin' })),
}))

jest.mock('@/features/poi-acquisition/queries/runs', () => ({
  getAcquisitionRun: jest.fn(async () => ({
    id: 'run-1',
    status: 'completed',
    error: null,
    city_name: 'Saint-Gervais',
    category_name: 'Dîner',
    candidates: [
      {
        id: 'cand-1',
        name: 'Brasserie Candidate',
        address: '1 Rue Test',
        source: 'gemini',
        match_status: 'matched',
        geocode_status: 'success',
        review_status: 'needs_review',
        duplicate_poi_ids: [],
        google_review_payload: { attribution: 'Google Maps' },
      },
    ],
  })),
  listAcquisitionRuns: jest.fn(async () => [
    {
      id: 'run-1',
      status: 'completed',
      city_name: 'Saint-Gervais',
      category_name: 'Dîner',
      candidate_count: 3,
      published_count: 1,
      needs_review_count: 2,
    },
    {
      id: 'run-2',
      status: 'failed',
      error: 'Gemini API timeout',
      city_name: 'Saint-Gervais',
      category_name: 'Shopping',
      candidate_count: 0,
      published_count: 0,
      needs_review_count: 0,
    },
  ]),
}))

jest.mock('@/features/poi-acquisition/queries/manual-poi', () => ({
  getManualPoiFormOptions: jest.fn(async () => ({
    cities: [{ id: 'city-1', name: 'Saint-Gervais-les-Bains' }],
    categories: [{ id: 'cat-1', name: 'Dîner', subcategories: [{ id: 'sub-1', name: 'Restaurants' }] }],
  })),
}))

describe('018 admin acquisition pages', () => {
  it('renders admin navigation for POI acquisition and manual creation', () => {
    render(<AdminPathLayout><div>Contenu</div></AdminPathLayout>)

    expect(screen.getAllByRole('link', { name: /Acquisition POI/i })[0]).toHaveAttribute('href', '/admin/poi-acquisition')
    expect(screen.getAllByRole('link', { name: /Créer POI/i })[0]).toHaveAttribute('href', '/admin/pois/new')
  })

  it('AC-02-01: renders acquisition runs with candidate counters', async () => {
    render(await AdminPoiAcquisitionPage())

    expect(screen.getByText('Acquisition POI')).toBeInTheDocument()
    expect(screen.getAllByText('Saint-Gervais')[0]).toBeInTheDocument()
    expect(screen.getByText('3 candidats')).toBeInTheDocument()
    expect(screen.getByText('Gemini API timeout')).toBeInTheDocument()
  })

  it('AC-02-01/05-03: renders candidate review statuses and Google attribution', async () => {
    render(await AdminPoiAcquisitionRunPage({ params: Promise.resolve({ id: 'run-1' }) }))

    expect(screen.getByText('Brasserie Candidate')).toBeInTheDocument()
    expect(screen.getByText('matched')).toBeInTheDocument()
    expect(screen.getByText('Google Maps')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Publier/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Rejeter/i })).toBeInTheDocument()
  })

  it('AC-04-01: renders manual POI creation form', async () => {
    render(await AdminNewPoiPage())

    expect(screen.getByText('Créer un POI')).toBeInTheDocument()
    expect(screen.getByLabelText('Nom')).toBeInTheDocument()
    expect(screen.getByLabelText('Adresse')).toBeInTheDocument()
  })
})
