import { NextRequest } from 'next/server'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const mockPending = jest.fn()
jest.mock('@/features/poi-photos/services/mirror-poi-photos', () => ({
  mirrorPendingPoiPhotos: (...a: unknown[]) => mockPending(...a),
}))

import { GET } from '@/app/api/internal/poi-photo-mirrors/sync/route'

const request = (auth?: string) => new NextRequest('http://localhost/api/internal/poi-photo-mirrors/sync', {
  headers: auth ? { authorization: auth } : {},
})

beforeEach(() => {
  process.env.INTERNAL_API_SECRET = 'secret-test'
  mockPending.mockReset().mockResolvedValue({ mirrored: 3, skipped: 5, failed: 1 })
})

describe('063 — tâche quotidienne de copie', () => {
  it('AC-01-04: traite un lot de 40 photos et renvoie le rapport', async () => {
    const response = await GET(request('Bearer secret-test'))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ mirrored: 3, skipped: 5, failed: 1 })
    expect(mockPending).toHaveBeenCalledWith(40)
  })

  it.each([undefined, 'Bearer mauvais'])('refuse un appel sans le bon secret (%s)', async auth => {
    const response = await GET(request(auth))
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Secret interne absent ou invalide', details: {} },
    })
    expect(mockPending).not.toHaveBeenCalled()
  })

  it('est planifiée dans vercel.json à 04:15', () => {
    const config = JSON.parse(readFileSync(join(process.cwd(), 'vercel.json'), 'utf8')) as { crons: Array<{ path: string; schedule: string }> }
    expect(config.crons).toContainEqual({ path: '/api/internal/poi-photo-mirrors/sync', schedule: '15 4 * * *' })
  })
})
