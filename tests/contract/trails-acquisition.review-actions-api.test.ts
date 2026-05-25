import { NextRequest } from 'next/server'
import { TrailsAcquisitionError } from '@/features/trails-acquisition/lib/errors'

const mockGetSessionAdmin = jest.fn()
const mockPublishTrailCandidate = jest.fn()
const mockMergeTrailCandidate = jest.fn()
const mockRejectTrailCandidate = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))

jest.mock('@/features/trails-acquisition/queries/review', () => ({
  publishTrailCandidate: (...args: unknown[]) => mockPublishTrailCandidate(...args),
  mergeTrailCandidate: (...args: unknown[]) => mockMergeTrailCandidate(...args),
  rejectTrailCandidate: (...args: unknown[]) => mockRejectTrailCandidate(...args),
}))

import { POST as publishPOST } from '@/app/api/admin/trails/candidates/[id]/publish/route'
import { POST as mergePOST } from '@/app/api/admin/trails/candidates/[id]/merge/route'
import { POST as rejectPOST } from '@/app/api/admin/trails/candidates/[id]/reject/route'

function request(url: string, body: object = {}) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('019 trail candidate review APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('AC-03-02: publishes a complete trail candidate as POI + TrailDetail', async () => {
    mockPublishTrailCandidate.mockResolvedValue({
      id: 'cand-1',
      review_status: 'published',
      published_poi_id: 'poi-1',
      trail_detail_id: 'trail-1',
    })

    const res = await publishPOST(
      request('http://localhost/api/admin/trails/candidates/cand-1/publish', {
        confirm_duplicate: true,
        confirm_incomplete_geometry: false,
      }),
      { params: Promise.resolve({ id: 'cand-1' }) },
    )

    expect(res.status).toBe(200)
    expect(mockPublishTrailCandidate).toHaveBeenCalledWith('cand-1', 'admin-1', {
      confirm_duplicate: true,
      confirm_incomplete_geometry: false,
    })
  })

  it('AC-02-03: maps incomplete geometry publication block to 409', async () => {
    mockPublishTrailCandidate.mockRejectedValue(new TrailsAcquisitionError('TRAIL_GEOMETRY_REQUIRED', 409))

    const res = await publishPOST(request('http://localhost/api/admin/trails/candidates/cand-1/publish'), {
      params: Promise.resolve({ id: 'cand-1' }),
    })
    const json = await res.json()

    expect(res.status).toBe(409)
    expect(json.error.code).toBe('TRAIL_GEOMETRY_REQUIRED')
  })

  it('AC-03-03: merges a duplicate candidate without creating a POI', async () => {
    mockMergeTrailCandidate.mockResolvedValue({
      id: 'cand-1',
      review_status: 'merged',
      published_poi_id: 'poi-existing',
    })

    const res = await mergePOST(
      request('http://localhost/api/admin/trails/candidates/cand-1/merge', { poi_id: '00000000-0000-4000-8000-000000000001' }),
      { params: Promise.resolve({ id: 'cand-1' }) },
    )

    expect(res.status).toBe(200)
    expect(mockMergeTrailCandidate).toHaveBeenCalledWith(
      'cand-1',
      '00000000-0000-4000-8000-000000000001',
      'admin-1',
    )
  })

  it('AC-03-04: rejects an unreliable candidate without public publication', async () => {
    mockRejectTrailCandidate.mockResolvedValue({ id: 'cand-1', review_status: 'rejected' })

    const res = await rejectPOST(
      request('http://localhost/api/admin/trails/candidates/cand-1/reject', { admin_note: 'Source non fiable' }),
      { params: Promise.resolve({ id: 'cand-1' }) },
    )

    expect(res.status).toBe(200)
    expect(mockRejectTrailCandidate).toHaveBeenCalledWith('cand-1', 'admin-1', 'Source non fiable')
  })
})
