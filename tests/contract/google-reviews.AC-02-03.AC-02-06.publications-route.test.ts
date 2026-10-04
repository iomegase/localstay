import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockSet = jest.fn()
const mockRevalidatePath = jest.fn()
jest.mock('next/cache', () => ({ revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args) }))
jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockGetSessionAdmin() }))
jest.mock('@/features/google-reviews/queries/publications', () => {
  const actual = jest.requireActual('@/features/google-reviews/queries/publications')
  return { ...actual, setGoogleReviewPublications: (...args: unknown[]) => mockSet(...args) }
})

import { GoogleReviewPublicationError } from '@/features/google-reviews/queries/publications'
import { PUT } from '@/app/api/admin/google-reviews/[id]/publications/route'

const ID = '7b0c6c1e-1f51-4f43-9b3b-2a8f8f3b9d10'
const SG = '0d1f6f9e-5a3c-4c47-8a1e-3a4b5c6d7e8f'
const put = (body: string, id = ID) => PUT(
  new NextRequest(`http://localhost/api/admin/google-reviews/${id}/publications`, {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body,
  }),
  { params: Promise.resolve({ id }) },
)

beforeEach(() => {
  jest.clearAllMocks()
  mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin' }, error: null })
})

describe('062 AC-02-03 / AC-02-06 — PUT publications', () => {
  it('AC-02-06 preserves admin authentication errors', async () => {
    const error = Response.json({ error: { code: 'FORBIDDEN', message: 'Accès refusé', details: {} } }, { status: 403 })
    mockGetSessionAdmin.mockResolvedValue({ user: null, error })
    expect((await put(JSON.stringify({ destination_ids: [SG] }))).status).toBe(403)
    expect(mockSet).not.toHaveBeenCalled()
  })

  it('sets publications, revalidates concierge landings and returns the contract body', async () => {
    mockSet.mockResolvedValue({ google_review_id: 'accounts/1/locations/2/reviews/a', published_destination_ids: [SG] })
    const response = await put(JSON.stringify({ destination_ids: [SG] }))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ google_review_id: 'accounts/1/locations/2/reviews/a', published_destination_ids: [SG] })
    expect(mockSet).toHaveBeenCalledWith(ID, [SG])
    expect(mockRevalidatePath).toHaveBeenCalledWith('/conciergerie/[city-slug]', 'page')
  })

  it.each([
    ['{broken', ID],
    [JSON.stringify({ destination_ids: ['not-a-uuid'] }), ID],
    [JSON.stringify({ destination_ids: [SG], extra: true }), ID],
    [JSON.stringify({ destination_ids: [SG] }), 'not-a-uuid'],
  ])('returns 400 VALIDATION_ERROR for %s', async (body, id) => {
    const response = await put(body, id)
    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe('VALIDATION_ERROR')
    expect(mockSet).not.toHaveBeenCalled()
  })

  it.each([
    ['REVIEW_NOT_FOUND', 404],
    ['DESTINATION_NOT_FOUND', 404],
    ['REVIEW_HAS_NO_TEXT', 422],
  ] as const)('maps %s to %s', async (code, status) => {
    mockSet.mockRejectedValue(new GoogleReviewPublicationError(code, status))
    const response = await put(JSON.stringify({ destination_ids: [SG] }))
    expect(response.status).toBe(status)
    expect((await response.json()).error.code).toBe(code)
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })
})
