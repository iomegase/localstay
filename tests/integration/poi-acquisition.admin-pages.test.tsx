/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminPathLayout from '@/app/admin/layout'
import AdminPoiAcquisitionPage from '@/app/admin/poi-acquisition/page'
import AdminPoiAcquisitionRunPage from '@/app/admin/poi-acquisition/runs/[id]/page'
import AdminNewPoiPage from '@/app/admin/pois/new/page'
import { AdminAcquisitionLauncher } from '@/features/poi-acquisition/components/AdminAcquisitionLauncher'
import { AdminManualPoiForm } from '@/features/poi-acquisition/components/AdminManualPoiForm'

jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/poi-acquisition',
  useRouter: () => ({
    replace: jest.fn(),
    refresh: jest.fn(),
    push: jest.fn(),
  }),
}))

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
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Gemini API timeout')).toBeInTheDocument()
  })

  it('AC-01-06: renders official website source checkbox and requires an URL when selected', () => {
    render(
      <AdminAcquisitionLauncher
        cities={[{ id: 'city-1', name: 'Saint-Gervais-les-Bains' }]}
        categories={[{ id: 'cat-1', name: 'Culture' }]}
      />,
    )

    expect(screen.queryByLabelText(/URL officielle/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('checkbox', { name: /Scanner le site officiel/i }))
    expect(screen.getByLabelText(/URL officielle/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Lancer l'acquisition/i }))

    expect(screen.getByText(/Renseignez une URL officielle/i)).toBeInTheDocument()
  })

  it('AC-02-01/05-03: renders candidate review statuses and Google attribution', async () => {
    render(await AdminPoiAcquisitionRunPage({ params: Promise.resolve({ id: 'run-1' }) }))

    expect(screen.getByText('Brasserie Candidate')).toBeInTheDocument()
    expect(screen.getByText(/Match:\s*matched/i)).toBeInTheDocument()
    expect(screen.getByText('Google Maps')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Publier/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Rejeter/i })).toBeInTheDocument()
  })

  it('AC-04-01: renders manual POI creation form', async () => {
    render(await AdminNewPoiPage())

    expect(screen.getByText('Créer un POI')).toBeInTheDocument()
    expect(screen.getByLabelText(/Importer depuis une URL officielle/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Nom')).toBeInTheDocument()
    expect(screen.getByLabelText('Adresse')).toBeInTheDocument()
  })

  it('AC-04-01: pre-fills manual POI fields from an official URL import', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          source_url: 'https://www.saintgervais.com/je-minforme/mobilite/montenvelo/',
          website: 'https://www.saintgervais.com/je-minforme/mobilite/montenvelo/',
          name: 'Montenvelo',
          address: '50 impasse des Lupins, 74170 Saint-Gervais-les-Bains',
          phone: '04 50 00 00 00',
          description: 'Montenvelo propose une offre de mobilité douce à Saint-Gervais.',
        },
      }),
    }) as jest.Mock

    render(
      <AdminManualPoiForm
        cities={[{ id: 'city-1', name: 'Saint-Gervais-les-Bains' }]}
        categories={[{ id: 'cat-1', name: 'Mobilité', subcategories: [] }]}
      />,
    )

    fireEvent.change(screen.getByLabelText(/Importer depuis une URL officielle/i), {
      target: { value: 'https://www.saintgervais.com/je-minforme/mobilite/montenvelo/' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Importer/i }))

    expect(await screen.findByDisplayValue('Montenvelo')).toBeInTheDocument()
    expect(screen.getByDisplayValue('50 impasse des Lupins, 74170 Saint-Gervais-les-Bains')).toBeInTheDocument()
    expect(screen.getAllByDisplayValue('https://www.saintgervais.com/je-minforme/mobilite/montenvelo/')).toHaveLength(2)
  })
})
