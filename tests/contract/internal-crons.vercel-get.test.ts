import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { NextRequest } from 'next/server'

const mockSync = jest.fn()
const mockGeocode = jest.fn()
jest.mock('@/features/admin-analytics/services/sync', () => ({ runAdminAnalyticsSync: (...args: unknown[]) => mockSync(...args) }))
jest.mock('@/features/geocoding/services/geocode-runner', () => ({ runGeocodeBatch: (...args: unknown[]) => mockGeocode(...args) }))

import { GET as analyticsGet } from '@/app/api/internal/analytics/sync/route'
import { GET as geocodeGet } from '@/app/api/internal/geocode-pois/route'

const SECRET = 'test-internal-secret'
const get = (path: string, token = SECRET) => new NextRequest(`http://localhost${path}`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } })

// 2026-10-18 — les crons Vercel appellent en GET : chaque route de vercel.json doit l'accepter.
describe('crons Vercel (GET)', () => {
  const previous = process.env.INTERNAL_API_SECRET
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.INTERNAL_API_SECRET = SECRET
    mockSync.mockResolvedValue({ status: 'success', synced_sources: ['gsc'] })
    mockGeocode.mockResolvedValue({ geocoded: 1, failed: 0, rejected: 0, skipped: 0 })
  })
  afterAll(() => { if (previous === undefined) delete process.env.INTERNAL_API_SECRET; else process.env.INTERNAL_API_SECRET = previous })

  it('GET /api/internal/analytics/sync lance la synchronisation par défaut', async () => {
    const res = await analyticsGet(get('/api/internal/analytics/sync'))
    expect(res.status).toBe(200)
    expect(mockSync).toHaveBeenCalledTimes(1)
  })

  it('GET /api/internal/geocode-pois lance un lot de 10', async () => {
    const res = await geocodeGet(get('/api/internal/geocode-pois'))
    expect(res.status).toBe(200)
    expect(mockGeocode).toHaveBeenCalledWith({ limit: 10 })
  })

  it('sans le secret : 401, rien ne tourne', async () => {
    expect((await analyticsGet(get('/api/internal/analytics/sync', 'faux'))).status).toBe(401)
    expect((await geocodeGet(get('/api/internal/geocode-pois', 'faux'))).status).toBe(401)
    expect(mockSync).not.toHaveBeenCalled()
    expect(mockGeocode).not.toHaveBeenCalled()
  })

  it('toutes les routes déclarées dans vercel.json exportent GET', () => {
    const crons = (JSON.parse(readFileSync(join(process.cwd(), 'vercel.json'), 'utf8')) as { crons: Array<{ path: string }> }).crons
    for (const { path } of crons) {
      const source = readFileSync(join(process.cwd(), 'src/app', path, 'route.ts'), 'utf8')
      expect([path, /export (async function|const) GET\b/.test(source)]).toEqual([path, true])
    }
  })
})
