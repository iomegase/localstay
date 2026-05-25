import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockCreateManualTrailCandidate = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))

jest.mock('@/features/trails-acquisition/queries/manual', () => ({
  createManualTrailCandidate: (...args: unknown[]) => mockCreateManualTrailCandidate(...args),
}))

import { POST } from '@/app/api/admin/trails/manual/route'

function request(body: object) {
  return new NextRequest('http://localhost/api/admin/trails/manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('019 manual trail candidate API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('AC-04-01: validates manual candidate payload server-side', async () => {
    const res = await POST(request({ title: 'Boucle des alpages' }))

    expect(res.status).toBe(400)
    expect(mockCreateManualTrailCandidate).not.toHaveBeenCalled()
  })

  it('AC-04-03: creates a manual candidate in review', async () => {
    mockCreateManualTrailCandidate.mockResolvedValue({
      id: 'cand-1',
      title: 'Boucle des alpages',
      primary_source_type: 'manual',
      review_status: 'needs_review',
      geometry_status: 'missing',
    })

    const res = await POST(request({
      city_id: '00000000-0000-4000-8000-000000000001',
      title: 'Boucle des alpages',
      difficulty: 'medium',
      start_latitude: 45.891,
      start_longitude: 6.713,
    }))

    expect(res.status).toBe(201)
    expect(mockCreateManualTrailCandidate).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Boucle des alpages' }),
      'admin-1',
    )
  })
})
