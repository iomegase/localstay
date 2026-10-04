import { NextRequest } from 'next/server'

const mockRun = jest.fn()
const mockGetSessionAdmin = jest.fn()
jest.mock('@/features/google-reviews/services/run-sync', () => {
  const actual = jest.requireActual('@/features/google-reviews/services/run-sync')
  return { ...actual, runGoogleReviewsSync: () => mockRun() }
})
jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockGetSessionAdmin() }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

import { GoogleBusinessError } from '@/shared/lib/google-business'
import { GET as cronSync } from '@/app/api/internal/google-reviews/sync/route'
import { POST as adminSync } from '@/app/api/admin/google-reviews/sync/route'

const summary = { fetched: 12, created: 2, updated: 1, deleted: 0 }
const cron = (authorization?: string) => new NextRequest('http://localhost/api/internal/google-reviews/sync', {
  headers: authorization ? { authorization } : {},
})

beforeEach(() => {
  jest.clearAllMocks()
  process.env.INTERNAL_API_SECRET = 'internal-secret'
})

describe('062 AC-01-06 — cron', () => {
  it.each([undefined, 'Bearer wrong'])('rejects %s with 401 UNAUTHORIZED without syncing', async authorization => {
    const response = await cronSync(cron(authorization))
    expect(response.status).toBe(401)
    expect((await response.json()).error.code).toBe('UNAUTHORIZED')
    expect(mockRun).not.toHaveBeenCalled()
  })

  it('returns the sync summary with the right secret', async () => {
    mockRun.mockResolvedValue(summary)
    const response = await cronSync(cron('Bearer internal-secret'))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(summary)
  })

  it.each([
    ['GOOGLE_NOT_CONFIGURED', 503],
    ['GOOGLE_API_ERROR', 502],
  ] as const)('maps %s to %s with the structured error body', async (code, status) => {
    mockRun.mockRejectedValue(new GoogleBusinessError(code, 'message'))
    const response = await cronSync(cron('Bearer internal-secret'))
    expect(response.status).toBe(status)
    expect(await response.json()).toEqual({ error: { code, message: 'message', details: {} } })
  })
})

describe('062 AC-02-05 / AC-02-06 — synchro manuelle admin', () => {
  it('preserves admin authentication errors', async () => {
    const error = Response.json({ error: { code: 'FORBIDDEN', message: 'Accès refusé', details: {} } }, { status: 403 })
    mockGetSessionAdmin.mockResolvedValue({ user: null, error })
    expect((await adminSync()).status).toBe(403)
    expect(mockRun).not.toHaveBeenCalled()
  })

  it('runs the same sync and returns its summary', async () => {
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin' }, error: null })
    mockRun.mockResolvedValue(summary)
    const response = await adminSync()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(summary)
  })
})
