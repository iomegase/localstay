import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockPublishCandidate = jest.fn()
const mockMergeCandidate = jest.fn()
const mockRejectCandidate = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))

jest.mock('@/features/poi-acquisition/queries/review', () => ({
  mergeCandidate: (...args: unknown[]) => mockMergeCandidate(...args),
  publishCandidate: (...args: unknown[]) => mockPublishCandidate(...args),
  rejectCandidate: (...args: unknown[]) => mockRejectCandidate(...args),
}))

import { POST as publishPOST } from '@/app/api/admin/poi-acquisition/candidates/[id]/publish/route'
import { POST as mergePOST } from '@/app/api/admin/poi-acquisition/candidates/[id]/merge/route'
import { POST as rejectPOST } from '@/app/api/admin/poi-acquisition/candidates/[id]/reject/route'

function request(url: string, body: object = {}) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('018 candidate review APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('AC-02-02: publishes a complete candidate as a public POI', async () => {
    mockPublishCandidate.mockResolvedValue({ id: 'cand-1', review_status: 'published', published_poi_id: 'poi-1' })

    const res = await publishPOST(request('http://localhost/api/admin/poi-acquisition/candidates/cand-1/publish'), {
      params: Promise.resolve({ id: 'cand-1' }),
    })

    expect(res.status).toBe(200)
    expect(mockPublishCandidate).toHaveBeenCalledWith('cand-1', 'admin-1', { confirm_duplicate: false })
  })

  it('AC-02-03: merges a duplicate candidate with an existing POI without creating a new one', async () => {
    mockMergeCandidate.mockResolvedValue({ id: 'cand-1', review_status: 'merged', published_poi_id: 'poi-existing' })

    const res = await mergePOST(
      request('http://localhost/api/admin/poi-acquisition/candidates/cand-1/merge', { poi_id: 'poi-existing' }),
      { params: Promise.resolve({ id: 'cand-1' }) },
    )

    expect(res.status).toBe(200)
    expect(mockMergeCandidate).toHaveBeenCalledWith('cand-1', 'poi-existing', 'admin-1')
  })

  it('AC-02-04: rejects an invalid candidate without creating a public POI', async () => {
    mockRejectCandidate.mockResolvedValue({ id: 'cand-1', review_status: 'rejected' })

    const res = await rejectPOST(
      request('http://localhost/api/admin/poi-acquisition/candidates/cand-1/reject', { admin_note: 'Adresse invalide' }),
      { params: Promise.resolve({ id: 'cand-1' }) },
    )

    expect(res.status).toBe(200)
    expect(mockRejectCandidate).toHaveBeenCalledWith('cand-1', 'admin-1', 'Adresse invalide')
  })
})
