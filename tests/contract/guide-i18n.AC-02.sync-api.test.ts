import { NextRequest } from 'next/server'

const mockCollect = jest.fn()
const mockTranslate = jest.fn()

jest.mock('@/features/content-translation/queries/store', () => ({
  collectAllTranslationSources: (...args: unknown[]) => mockCollect(...args),
  prismaTranslationStore: {},
}))
jest.mock('@/features/content-translation/services/translate-sources', () => ({
  translateSources: (...args: unknown[]) => mockTranslate(...args),
}))

import { GET } from '@/app/api/internal/translations/sync/route'

function request(authorization?: string) {
  return new NextRequest('http://localhost:3000/api/internal/translations/sync', {
    headers: authorization ? { authorization } : {},
  })
}

const ENV = { ...process.env }

beforeEach(() => {
  mockCollect.mockReset().mockResolvedValue([{ entityType: 'PointOfInterest', entityId: 'p1', field: 'description', text: 'Ferme' }])
  mockTranslate.mockReset()
  process.env = { ...ENV, INTERNAL_API_SECRET: 'secret', DEEPL_API_KEY: 'k:fx' }
})
afterAll(() => { process.env = ENV })

describe('GET /api/internal/translations/sync — spec 061 A1', () => {
  it('401 UNAUTHORIZED sans le secret interne', async () => {
    const res = await GET(request('Bearer nope'))
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: { code: 'UNAUTHORIZED', message: expect.any(String), details: {} } })
    expect(mockCollect).not.toHaveBeenCalled()
  })

  it('200 avec le bilan de la synchronisation', async () => {
    mockTranslate.mockResolvedValue({ translated: 1, failed: 0, remaining: 0 })
    const res = await GET(request('Bearer secret'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ translated: 1, failed: 0, remaining: 0 })
    expect(mockTranslate).toHaveBeenCalledWith(
      [{ entityType: 'PointOfInterest', entityId: 'p1', field: 'description', text: 'Ferme' }],
      expect.objectContaining({ config: { apiKey: 'k:fx', baseUrl: undefined }, limit: 400 }),
    )
  })

  it('AC-02-05: sans clé DeepL, 200 et skipped NO_PROVIDER_KEY', async () => {
    delete process.env.DEEPL_API_KEY
    mockTranslate.mockResolvedValue({ translated: 0, failed: 0, remaining: 1, skipped: 'NO_PROVIDER_KEY' })
    const res = await GET(request('Bearer secret'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ translated: 0, failed: 0, remaining: 1, skipped: 'NO_PROVIDER_KEY' })
    expect(mockTranslate).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ config: null }))
  })
})
