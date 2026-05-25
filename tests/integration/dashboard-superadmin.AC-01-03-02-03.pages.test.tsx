/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminPathLayout from '@/app/admin/layout'
import AdminOverviewPage from '@/app/admin/page'
import AdminCitiesPage from '@/app/admin/cities/page'
import AdminUsersPage from '@/app/admin/users/page'

jest.mock('@/features/merchant/lib/get-page-admin', () => ({
  getPageAdmin: jest.fn(async () => ({ id: 'admin-1', role: 'admin' })),
}))

jest.mock('@/features/admin/queries/dashboard', () => ({
  getAdminOverview: jest.fn(async () => ({
    kpis: {
      active_cities: 2,
      active_pois: 18,
      active_owners: 4,
      active_merchants: 3,
      pending_claims: 1,
      qr_scans_30d: 42,
    },
    qr_scans_series: Array.from({ length: 30 }, (_, index) => ({ date: `2026-05-${String(index + 1).padStart(2, '0')}`, count: index })),
    latest_pending_claims: [{ id: 'claim-1', merchant_email: 'm@test.dev', poi_name: 'Bistrot', city_name: 'Saint-Gervais', created_at: '2026-05-24T10:00:00.000Z' }],
    billing_notice: 'Facturation non activée en MVP 2',
  })),
  getAdminCities: jest.fn(async () => [
    {
      id: 'city-1',
      name: 'Saint-Gervais',
      slug: 'saint-gervais',
      postal_code: '74170',
      is_active: true,
      active_poi_count: 0,
      active_lodging_count: 2,
      qr_scans_30d: 7,
      status_label: 'needs_enrichment',
    },
  ]),
  getAdminUsers: jest.fn(async () => [
    {
      id: 'user-1',
      email: 'owner@test.dev',
      role: 'owner',
      is_active: true,
      created_at: '2026-05-24T10:00:00.000Z',
      subscription_status: 'trial',
    },
  ]),
}))

jest.mock('recharts', () => ({
  Bar: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  CartesianGrid: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}))

describe('016 superadmin pages', () => {
  it('AC-01-03: renders the admin layout navigation', () => {
    render(<AdminPathLayout><div>Contenu</div></AdminPathLayout>)

    expect(screen.getAllByRole('link', { name: /Vue globale/i })[0]).toHaveAttribute('href', '/admin')
    expect(screen.getAllByRole('link', { name: /Revendications/i })[0]).toHaveAttribute('href', '/admin/merchant-claims')
    expect(screen.getAllByRole('link', { name: /Villes/i })[0]).toHaveAttribute('href', '/admin/cities')
    expect(screen.getAllByRole('link', { name: /Utilisateurs/i })[0]).toHaveAttribute('href', '/admin/users')
  })

  it('AC-01-01/02-01/02-03/03-04: renders the admin overview cockpit', async () => {
    render(await AdminOverviewPage())

    expect(screen.getByText('Cockpit Super-Admin')).toBeInTheDocument()
    expect(screen.getByText('Villes actives')).toBeInTheDocument()
    expect(screen.getByText('Facturation non activée en MVP 2')).toBeInTheDocument()
    expect(screen.getByText('Bistrot')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Gérer les POI par ville/i })).toHaveAttribute('href', '/admin/pois')
  })

  it('AC-04-01/04-02/04-03: renders consultative cities with public guide link', async () => {
    render(await AdminCitiesPage())

    expect(screen.getByText('Saint-Gervais')).toBeInTheDocument()
    expect(screen.getByText('À enrichir')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Voir le guide/i })).toHaveAttribute('href', '/guide/saint-gervais')
  })

  it('AC-05-01/05-03: renders consultative users without mutation actions', async () => {
    render(await AdminUsersPage({ searchParams: Promise.resolve({ role: 'owner' }) }))

    expect(screen.getByText('owner@test.dev')).toBeInTheDocument()
    expect(screen.getByText('trial')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /désactiver/i })).not.toBeInTheDocument()
  })
})
