import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockCreate = jest.fn()
const mockList = jest.fn()
const mockRevalidatePath = jest.fn()

jest.mock('next/cache', () => ({ revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args) }))
jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockGetSessionAdmin() }))
jest.mock('@/features/local-seo/queries/landing-reviews', () => ({
  createLandingReview: (...args: unknown[]) => mockCreate(...args),
  listAdminLandingPages: () => mockList(),
}))

import { GET, POST } from '@/app/api/admin/landing-page-reviews/route'

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
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        destination_slug: 'saint-gervais-les-bains', author: 'Marie',
        quote: 'Un séjour parfaitement accompagné par MyStay.', stay_date: null,
        source: 'DIRECT', rating: 5, sort_order: 0,
      }),
    })
    const response = await POST(request)
    expect(response.status).toBe(201)
    expect(mockRevalidatePath).toHaveBeenCalledWith('/conciergerie/saint-gervais-les-bains', 'page')
  })
})
