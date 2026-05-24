import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockGetAdminOverview = jest.fn()
const mockGetAdminCities = jest.fn()
const mockGetAdminUsers = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: function() {
    return mockGetSessionAdmin.apply(this, arguments as never)
  },
}))

jest.mock('@/features/admin/queries/dashboard', () => ({
  getAdminOverview: function() {
    return mockGetAdminOverview.apply(this, arguments as never)
  },
  getAdminCities: function() {
    return mockGetAdminCities.apply(this, arguments as never)
  },
  getAdminUsers: function() {
    return mockGetAdminUsers.apply(this, arguments as never)
  },
}))

import { GET as overviewGET } from '@/app/api/admin/overview/route'
import { GET as citiesGET } from '@/app/api/admin/cities/route'
import { GET as usersGET } from '@/app/api/admin/users/route'

const admin = { id: 'admin-1', role: 'admin' }

describe('016 superadmin API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: admin, error: null })
    mockGetAdminOverview.mockResolvedValue({
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
    })
    mockGetAdminCities.mockResolvedValue([
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
    ])
    mockGetAdminUsers.mockResolvedValue([
      {
        id: 'user-1',
        email: 'owner@test.dev',
        role: 'owner',
        is_active: true,
        created_at: '2026-05-24T10:00:00.000Z',
        subscription_status: 'trial',
      },
    ])
  })

  it('AC-02-01/02-03/03-04: returns overview KPIs, latest claims and MVP2 billing notice', async () => {
    const res = await overviewGET(new NextRequest('http://localhost/api/admin/overview'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.kpis.pending_claims).toBe(1)
    expect(json.qr_scans_series).toHaveLength(30)
    expect(json.latest_pending_claims).toHaveLength(1)
    expect(json.billing_notice).toBe('Facturation non activée en MVP 2')
  })

  it('AC-04-01: returns consultative city rows', async () => {
    const res = await citiesGET(new NextRequest('http://localhost/api/admin/cities'))

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: expect.arrayContaining([expect.objectContaining({ status_label: 'needs_enrichment' })]) })
  })

  it('AC-05-01/05-02: returns consultative users filtered by role', async () => {
    const res = await usersGET(new NextRequest('http://localhost/api/admin/users?role=owner'))

    expect(res.status).toBe(200)
    expect(mockGetAdminUsers).toHaveBeenCalledWith('owner')
    await expect(res.json()).resolves.toEqual({ data: expect.arrayContaining([expect.objectContaining({ role: 'owner' })]) })
  })

  it('AC-01-02: returns admin auth errors unchanged', async () => {
    const error = Response.json({ error: { code: 'FORBIDDEN', message: 'Accès réservé aux administrateurs', details: {} } }, { status: 403 })
    mockGetSessionAdmin.mockResolvedValue({ user: null, error })

    const res = await overviewGET(new NextRequest('http://localhost/api/admin/overview'))

    expect(res.status).toBe(403)
    expect(mockGetAdminOverview).not.toHaveBeenCalled()
  })

  it('AC-05-02: rejects invalid user role filters', async () => {
    const res = await usersGET(new NextRequest('http://localhost/api/admin/users?role=tourist'))

    expect(res.status).toBe(400)
    expect(mockGetAdminUsers).not.toHaveBeenCalled()
  })
})
