/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminPathLayout from '@/app/admin/layout'
import AdminTrailsPage from '@/app/admin/trails/page'
import AdminTrailRunPage from '@/app/admin/trails/runs/[id]/page'
import AdminNewTrailPage from '@/app/admin/trails/new/page'

jest.mock('@/features/merchant/lib/get-page-admin', () => ({
  getPageAdmin: jest.fn(async () => ({ id: 'admin-1', role: 'admin' })),
}))

jest.mock('@/features/trails-acquisition/queries/options', () => ({
  getTrailAcquisitionOptions: jest.fn(async () => ({
    cities: [{ id: 'city-1', name: 'Saint-Gervais-les-Bains' }],
    rando_category_id: 'cat-rando',
  })),
}))

jest.mock('@/features/trails-acquisition/queries/runs', () => ({
  listTrailImportRuns: jest.fn(async () => [
    {
      id: 'run-1',
      status: 'partial_success',
      city_name: 'Saint-Gervais-les-Bains',
      source_types: ['official_website', 'overpass'],
      candidate_count: 2,
      needs_review_count: 1,
      published_count: 1,
      error: null,
      source_errors: { ign: 'timeout' },
      created_at: '2026-05-25T00:00:00.000Z',
    },
  ]),
  getTrailImportRun: jest.fn(async () => ({
    id: 'run-1',
    status: 'completed',
    city_name: 'Saint-Gervais-les-Bains',
    source_types: ['official_website'],
    error: null,
    source_errors: null,
    candidates: [
      {
        id: 'cand-1',
        title: 'Boucle des alpages',
        description: 'Depuis le Bettex.',
        primary_source_type: 'official_website',
        source_refs: [{ type: 'official_website', attribution: 'Office de tourisme', used_for: ['content'] }],
        difficulty: 'medium',
        distance_km: 7.5,
        elevation_gain_m: 420,
        estimated_duration_min: 150,
        data_quality_status: 'complete',
        start_label: 'Parking du Bettex',
        start_latitude: 45.891,
        start_longitude: 6.713,
        geometry_status: 'valid',
        elevation_status: 'valid',
        duplicate_poi_ids: [],
        review_status: 'needs_review',
      },
    ],
  })),
}))

describe('019 admin trail pages', () => {
  it('renders admin navigation link for trails', () => {
    render(<AdminPathLayout><div>Contenu</div></AdminPathLayout>)

    expect(screen.getAllByRole('link', { name: /Randonnées/i })[0]).toHaveAttribute('href', '/admin/trails')
  })

  it('AC-03-01: renders trail acquisition runs and launcher', async () => {
    render(await AdminTrailsPage())

    expect(screen.getByText('Acquisition randonnées')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Overpass/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Site officiel/i })).not.toBeChecked()
    expect(screen.getByRole('combobox', { name: /Rayon/i })).toHaveValue('15')
    expect(screen.getByText('2 candidats · 1 en revue · 1 publiés')).toBeInTheDocument()
    expect(screen.getByText('Sources: official_website, overpass')).toBeInTheDocument()
  })

  it('AC-03-01: renders trail candidates with source, geometry and actions', async () => {
    render(await AdminTrailRunPage({ params: Promise.resolve({ id: 'run-1' }) }))

    expect(screen.getByText('Boucle des alpages')).toBeInTheDocument()
    expect(screen.getAllByText('valid')).toHaveLength(2)
    expect(screen.getByText(/Durée: 2 h 30/)).toBeInTheDocument()
    expect(screen.getByText(/Coordonnées départ: 45.891000, 6.713000/)).toBeInTheDocument()
    expect(screen.getByText(/Office de tourisme/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Publier$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Rejeter/i })).toBeInTheDocument()
  })

  it('AC-04-01: renders manual trail creation form', async () => {
    render(await AdminNewTrailPage())

    expect(screen.getByText('Créer une randonnée')).toBeInTheDocument()
    expect(screen.getByLabelText('Nom')).toBeInTheDocument()
    expect(screen.getByLabelText('Latitude départ')).toBeInTheDocument()
  })
})
