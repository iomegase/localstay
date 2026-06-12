import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockListAdminLodgingProfiles = jest.fn()
const mockPublishLodgingProfile = jest.fn()
const mockRequestChangesLodgingProfile = jest.fn()
const mockArchiveLodgingProfile = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: (...args: unknown[]) => mockGetSessionAdmin(...args),
}))

jest.mock('@/features/lodging-showcase/queries/admin-public-profiles', () => ({
  listAdminLodgingProfiles: (...args: unknown[]) => mockListAdminLodgingProfiles(...args),
  publishLodgingProfile: (...args: unknown[]) => mockPublishLodgingProfile(...args),
  requestChangesLodgingProfile: (...args: unknown[]) => mockRequestChangesLodgingProfile(...args),
  archiveLodgingProfile: (...args: unknown[]) => mockArchiveLodgingProfile(...args),
}))

import { GET as LIST_GET } from '@/app/api/admin/lodgings/public-profiles/route'
import { POST as PUBLISH_POST } from '@/app/api/admin/lodgings/public-profiles/[profileId]/publish/route'
import { POST as REQUEST_CHANGES_POST } from '@/app/api/admin/lodgings/public-profiles/[profileId]/request-changes/route'
import { POST as ARCHIVE_POST } from '@/app/api/admin/lodgings/public-profiles/[profileId]/archive/route'

function request(url: string, method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('028 admin lodging moderation API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('AC-06-01: lists lodging profiles with filters', async () => {
    mockListAdminLodgingProfiles.mockResolvedValue([
      {
        id: 'profile-1',
        publication_status: 'review',
        lodging: { id: 'lodging-1', name: 'Chalet Hygge', owner: { id: 'owner-1', email: 'owner@example.test' } },
        city: { id: 'city-1', name: 'Annecy', slug: 'annecy' },
        photos_count: 4,
        seo_warnings: ['seo_photo_count'],
        updated_at: '2026-06-12T10:00:00.000Z',
      },
    ])

    const res = await LIST_GET(
      request('http://localhost/api/admin/lodgings/public-profiles?publication_status=review&city_id=city-1&owner_id=owner-1'),
    )

    expect(res.status).toBe(200)
    expect(mockListAdminLodgingProfiles).toHaveBeenCalledWith({
      publication_status: 'review',
      city_id: 'city-1',
      owner_id: 'owner-1',
    })
  })

  it('AC-06-02: publishes a profile in review', async () => {
    mockPublishLodgingProfile.mockResolvedValue({
      id: 'profile-1',
      publication_status: 'published',
      published_at: '2026-06-12T10:00:00.000Z',
    })

    const res = await PUBLISH_POST(
      request('http://localhost/api/admin/lodgings/public-profiles/11111111-1111-4111-8111-111111111111/publish', 'POST'),
      { params: Promise.resolve({ profileId: '11111111-1111-4111-8111-111111111111' }) },
    )

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      id: 'profile-1',
      publication_status: 'published',
    })
  })

  it('AC-06-03: requests changes with an admin note', async () => {
    mockRequestChangesLodgingProfile.mockResolvedValue({
      id: 'profile-1',
      publication_status: 'draft',
      admin_review_note: 'Ajouter des photos avec alt.',
    })

    const res = await REQUEST_CHANGES_POST(
      request(
        'http://localhost/api/admin/lodgings/public-profiles/11111111-1111-4111-8111-111111111111/request-changes',
        'POST',
        { admin_review_note: 'Ajouter des photos avec alt.' },
      ),
      { params: Promise.resolve({ profileId: '11111111-1111-4111-8111-111111111111' }) },
    )

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      publication_status: 'draft',
      admin_review_note: 'Ajouter des photos avec alt.',
    })
  })

  it('returns 400 when the review note is too short', async () => {
    const res = await REQUEST_CHANGES_POST(
      request(
        'http://localhost/api/admin/lodgings/public-profiles/11111111-1111-4111-8111-111111111111/request-changes',
        'POST',
        { admin_review_note: 'bad' },
      ),
      { params: Promise.resolve({ profileId: '11111111-1111-4111-8111-111111111111' }) },
    )

    expect(res.status).toBe(400)
    expect(mockRequestChangesLodgingProfile).not.toHaveBeenCalled()
  })

  it('AC-06-04: archives a published profile without deleting it', async () => {
    mockArchiveLodgingProfile.mockResolvedValue({
      id: 'profile-1',
      publication_status: 'archived',
    })

    const res = await ARCHIVE_POST(
      request('http://localhost/api/admin/lodgings/public-profiles/11111111-1111-4111-8111-111111111111/archive', 'POST'),
      { params: Promise.resolve({ profileId: '11111111-1111-4111-8111-111111111111' }) },
    )

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      publication_status: 'archived',
    })
  })

  it('preserves admin auth errors', async () => {
    const error = Response.json(
      { error: { code: 'FORBIDDEN', message: 'Accès réservé aux administrateurs', details: {} } },
      { status: 403 },
    )
    mockGetSessionAdmin.mockResolvedValue({ user: null, error })

    const res = await LIST_GET(request('http://localhost/api/admin/lodgings/public-profiles'))

    expect(res.status).toBe(403)
    expect(mockListAdminLodgingProfiles).not.toHaveBeenCalled()
  })
})
