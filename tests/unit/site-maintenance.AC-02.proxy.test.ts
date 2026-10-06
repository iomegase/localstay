import { NextRequest } from 'next/server'
import { isMaintenanceEnabled } from '@/features/maintenance/queries/maintenance'

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseMiddlewareClient: jest.fn(() => ({
    auth: { getUser: jest.fn(async () => ({ data: { user: null } })) },
  })),
}))

import { proxy } from '../../src/proxy'

const request = (path: string) => new NextRequest(`http://localhost:3000${path}`)

// Spec 087 US-02 — proxy en mode maintenance.
describe('087 — site public en maintenance', () => {
  const originalVercelEnv = process.env.VERCEL_ENV
  beforeEach(() => {
    jest.mocked(isMaintenanceEnabled).mockResolvedValue(true)
    process.env.VERCEL_ENV = 'production'
  })
  afterAll(() => {
    jest.mocked(isMaintenanceEnabled).mockResolvedValue(false)
    if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV
    else process.env.VERCEL_ENV = originalVercelEnv
  })

  it.each(['/', '/decouvrir', '/decouvrir/saint-gervais-les-bains', '/logements/le-305', '/conciergerie/megeve', '/journal', '/mentions-legales'])(
    'AC-02-01 : %s → page de maintenance en 503, non indexée',
    async path => {
      const response = await proxy(request(path))
      expect(response.status).toBe(503)
      expect(response.headers.get('x-middleware-rewrite')).toBe('http://localhost:3000/maintenance')
      expect(response.headers.get('retry-after')).toBe('3600')
      expect(response.headers.get('x-robots-tag')).toBe('noindex')
    },
  )

  it.each(['/connexion', '/sejour', '/admin', '/dashboard', '/auth/login'])('AC-02-02 : %s reste accessible', async path => {
    const response = await proxy(request(path))
    expect(response.status).not.toBe(503)
    expect(response.headers.get('x-middleware-rewrite')).not.toBe('http://localhost:3000/maintenance')
  })

  it.each([undefined, 'preview', 'development'])('AC-02-04 : VERCEL_ENV=%s (local, prévisualisation) → site public ouvert', async vercelEnv => {
    if (vercelEnv === undefined) delete process.env.VERCEL_ENV
    else process.env.VERCEL_ENV = vercelEnv
    const response = await proxy(request('/'))
    expect(response.status).not.toBe(503)
    expect(response.headers.get('x-middleware-rewrite')).not.toBe('http://localhost:3000/maintenance')
  })

  it('mode inactif : le site public est servi normalement', async () => {
    jest.mocked(isMaintenanceEnabled).mockResolvedValue(false)
    const response = await proxy(request('/'))
    expect(response.status).not.toBe(503)
  })
})
