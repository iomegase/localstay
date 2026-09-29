import { NextRequest, NextResponse } from 'next/server'
import { DescriptionAssistanceError } from '@/features/poi-description-assistance/lib/contracts'
const mockSession = jest.fn()
const mockSuggest = jest.fn()
jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockSession() }))
jest.mock('@/features/poi-description-assistance/queries/suggest-description', () => ({ suggestPoiDescription: (...args: unknown[]) => mockSuggest(...args) }))
import { POST } from '@/app/api/admin/pois/[id]/suggest-description/route'

const id = '44444444-4444-4444-8444-444444444444'
const context = { params: Promise.resolve({ id }) }
const request = (body?: string) => new NextRequest(`http://localhost/api/admin/pois/${id}/suggest-description`, { method: 'POST', body })
beforeEach(() => { jest.clearAllMocks(); mockSession.mockResolvedValue({ user: { id: 'admin' }, error: null }) })

it.each([401, 403])('rejects unauthorized users (%s) before generating', async status => {
  mockSession.mockResolvedValue({ error: NextResponse.json({ error: { code: status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN' } }, { status }) })
  expect((await POST(request(), context)).status).toBe(status)
  expect(mockSuggest).not.toHaveBeenCalled()
})

it('validates the UUID and rejects unexpected bodies', async () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {})
  expect((await POST(request(), { params: Promise.resolve({ id: 'bad' }) })).status).toBe(400)
  expect((await POST(request('{"website":"http://localhost"}'), context)).status).toBe(400)
  expect(mockSuggest).not.toHaveBeenCalled()
  log.mockRestore()
})

it('AC-05: returns a no-store suggestion with the exact contract', async () => {
  const data = { description: 'Texte relu.', source_mode: 'web_search', sources: [{ title: 'Tourisme', url: 'https://tourisme.example' }], search_entry_point: null }
  mockSuggest.mockResolvedValue(data)
  const response = await POST(request(), context)
  expect(response.status).toBe(200)
  expect(response.headers.get('Cache-Control')).toBe('no-store')
  await expect(response.json()).resolves.toEqual({ data })
  expect(mockSuggest).toHaveBeenCalledWith(id)
})

it('AC-05: accepts an empty non-null body stream supplied by the Node adapter', async () => {
  const poiId = '33c7fd7e-aa0e-4512-baa0-e8a1bd97aa3e'
  const emptyPost = request('')
  expect(emptyPost.body).not.toBeNull()
  mockSuggest.mockResolvedValue({ description: 'Proposition à relire.' })
  const response = await POST(emptyPost, { params: Promise.resolve({ id: poiId }) })
  expect(response.status).toBe(200)
  expect(mockSuggest).toHaveBeenCalledWith(poiId)
})

it('rejects a chunked payload even when the content-length header is absent', async () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {})
  const nonEmpty = request('unexpected')
  expect(nonEmpty.headers.has('content-length')).toBe(false)
  expect((await POST(nonEmpty, context)).status).toBe(400)
  expect(mockSuggest).not.toHaveBeenCalled()
  log.mockRestore()
})

it.each(['POI_NOT_FOUND', 'POI_ARCHIVED', 'SOURCE_URL_UNREADABLE', 'DESCRIPTION_SOURCES_INSUFFICIENT', 'DESCRIPTION_GENERATION_FAILED', 'DESCRIPTION_SERVICE_UNAVAILABLE'] as const)('AC-04: reports %s without exposing provider data', async code => {
  const failure = new DescriptionAssistanceError(code)
  const log = jest.spyOn(console, 'error').mockImplementation(() => {})
  mockSuggest.mockRejectedValue(failure)
  const response = await POST(request(), context)
  expect(response.status).toBe(failure.status)
  await expect(response.json()).resolves.toEqual({ error: { code, message: failure.message, details: {} } })
  expect(log).toHaveBeenCalledWith('[poi-description-assistance]', { code, status: failure.status })
  log.mockRestore()
})
