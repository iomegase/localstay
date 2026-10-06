import { NextRequest } from 'next/server'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const mockCleanup = jest.fn()
jest.mock('@/features/storage-cleanup/services/weekly-cleanup', () => ({
  cleanupUnusedStorageFiles: (...args: unknown[]) => mockCleanup(...args),
}))

import { GET, POST } from '@/app/api/internal/storage-cleanup/route'

// Spec 070 US-04 — route de la tâche hebdomadaire.
const report = { scanned: 10, deleted: 2, bytes_freed: 4096, dry_run: false }

function request(method: 'GET' | 'POST', secret?: string, body?: unknown) {
  return new NextRequest('http://localhost/api/internal/storage-cleanup', {
    method,
    headers: { ...(secret ? { authorization: `Bearer ${secret}` } : {}), 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

describe('070 — /api/internal/storage-cleanup', () => {
  const originalSecret = process.env.INTERNAL_API_SECRET
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.INTERNAL_API_SECRET = 'secret-test'
    mockCleanup.mockResolvedValue(report)
  })
  afterAll(() => { process.env.INTERNAL_API_SECRET = originalSecret })

  it('refuse sans secret', async () => {
    const res = await GET(request('GET'))
    expect(res.status).toBe(401)
    expect(mockCleanup).not.toHaveBeenCalled()
  })

  it('AC-04-01 : la tâche planifiée supprime réellement', async () => {
    const res = await GET(request('GET', 'secret-test'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: report })
    expect(mockCleanup).toHaveBeenCalledWith({ dryRun: false })
  })

  it('AC-04-04 : POST dry_run → simulation', async () => {
    await POST(request('POST', 'secret-test', { dry_run: true }))
    expect(mockCleanup).toHaveBeenCalledWith({ dryRun: true })
  })

  it('POST : corps invalide → 400', async () => {
    const res = await POST(request('POST', 'secret-test', { dry_run: 'oui' }))
    expect(res.status).toBe(400)
  })

  it('tâche hebdomadaire déclarée dans vercel.json (lundi 03:00)', () => {
    const vercel = JSON.parse(readFileSync(join(process.cwd(), 'vercel.json'), 'utf8')) as { crons: Array<{ path: string; schedule: string }> }
    expect(vercel.crons).toContainEqual({ path: '/api/internal/storage-cleanup', schedule: '0 3 * * 1' })
  })
})
