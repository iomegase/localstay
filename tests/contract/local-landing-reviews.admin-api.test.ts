import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockCreate = jest.fn()
const mockList = jest.fn()
const mockUpdate = jest.fn()
const mockRevalidatePath = jest.fn()

jest.mock('next/cache', () => ({ revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args) }))
jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockGetSessionAdmin() }))
jest.mock('@/features/local-seo/queries/landing-reviews', () => ({
  LandingReviewError: class LandingReviewError extends Error {
    constructor(
      public readonly code: 'NOT_FOUND' | 'VALIDATION_ERROR',
      public readonly status = 404,
    ) {
      super(code)
    }
  },
  createLandingReview: (...args: unknown[]) => mockCreate(...args),
  listAdminLandingPages: () => mockList(),
  updateLandingReview: (...args: unknown[]) => mockUpdate(...args),
}))

import { LandingReviewError } from '@/features/local-seo/queries/landing-reviews'
import { GET, POST } from '@/app/api/admin/landing-page-reviews/route'
import { PATCH } from '@/app/api/admin/landing-page-reviews/[id]/route'

const validReview = {
  destination_slug: 'saint-gervais-les-bains', author: 'Marie',
  quote: 'Un séjour parfaitement accompagné par MyStay.', stay_date: null,
  source: 'DIRECT', rating: 5, sort_order: 0,
}

describe('047 landing reviews admin API', () => {
  beforeEach(() => jest.clearAllMocks())

  it('preserves admin authentication errors', async () => {
    const error = Response.json({ error: { code: 'FORBIDDEN', message: 'Accès refusé', details: {} } }, { status: 403 })
    mockGetSessionAdmin.mockResolvedValue({ user: null, error })
    expect((await GET()).status).toBe(403)
    expect(mockList).not.toHaveBeenCalled()
  })

  it('creates and immediately revalidates a valid city review', async () => {
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin' }, error: null })
    mockCreate.mockResolvedValue({ id: 'review', destination_slug: 'saint-gervais-les-bains' })
    const request = new NextRequest('http://localhost/api/admin/landing-page-reviews', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(validReview),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    expect(mockRevalidatePath).toHaveBeenCalledWith('/conciergerie/saint-gervais-les-bains', 'page')
  })

  it('returns a validation error when creation targets an unavailable destination', async () => {
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin' }, error: null })
    mockCreate.mockRejectedValue(new LandingReviewError('VALIDATION_ERROR', 400))

    const response = await POST(new NextRequest('http://localhost/api/admin/landing-page-reviews', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(validReview),
    }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'La destination sélectionnée est indisponible.',
        details: { destination_slug: ['La destination doit être active et non supprimée.'] },
      },
    })
  })

  it('does not report an existing review as missing when its replacement destination is unavailable', async () => {
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin' }, error: null })
    mockUpdate.mockRejectedValue(new LandingReviewError('VALIDATION_ERROR', 400))

    const response = await PATCH(new NextRequest('http://localhost/api/admin/landing-page-reviews/review-1', {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(validReview),
    }), { params: Promise.resolve({ id: 'a80e52ea-371b-46a1-9d56-c124157254bd' }) })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'La destination sélectionnée est indisponible.',
        details: { destination_slug: ['La destination doit être active et non supprimée.'] },
      },
    })
  })
})
