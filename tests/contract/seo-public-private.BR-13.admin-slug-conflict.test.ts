import { NextRequest } from 'next/server'
import { LodgingSlugConflictError } from '@/features/lodging-showcase/lib/slug'

const mockGetSessionAdmin = jest.fn()
const mockSaveAdminPublicProfile = jest.fn()
const mockRevalidatePublicLodgingPaths = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))

jest.mock('@/features/lodging-showcase/queries/owner-public-profile', () => ({
  saveAdminPublicProfile: (...args: unknown[]) => mockSaveAdminPublicProfile(...args),
}))

jest.mock('@/features/lodging-showcase/lib/revalidation', () => ({
  revalidatePublicLodgingPaths: () => mockRevalidatePublicLodgingPaths(),
}))

import { PUT } from '@/app/api/admin/lodgings/[id]/public-profile/route'

const validPayload = {
  title: 'Chalet Hygge',
  short_description: 'Un chalet lumineux pour séjourner à Annecy dans l univers MyStay.',
  description: 'Une description suffisamment détaillée pour la fiche publique du logement et son référencement local.',
  property_type: 'Chalet',
  max_guests: 4,
  bedroom_count: 2,
  bathroom_count: 1,
  bed_count: 3,
  surface_m2: 70,
  public_area_label: 'Annecy-le-Vieux',
  external_booking_url: null,
  public_contact_enabled: true,
  seo_title: 'Chalet Hygge à Annecy | MyStay',
  seo_description: 'Séjournez dans un chalet lumineux à Annecy avec guide local, photos et réservation externe.',
  source_description_text: null,
  photos: [],
  amenities: [],
}

describe('042 BR-13 admin lodging slug conflicts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
      error: null,
    })
  })

  it('returns the exact safe 409 contract without database internals', async () => {
    mockSaveAdminPublicProfile.mockRejectedValue(new LodgingSlugConflictError())

    const res = await PUT(
      new NextRequest('http://localhost/api/admin/lodgings/lodging-1/public-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body).toEqual({
      error: {
        code: 'LODGING_SLUG_CONFLICT',
        message: 'Cette URL de logement est déjà utilisée',
        details: {},
      },
    })
    expect(JSON.stringify(body)).not.toMatch(/P2002|Prisma|constraint|LodgingPublicProfile_slug_key|SELECT|INSERT|stack/i)
    expect(mockRevalidatePublicLodgingPaths).not.toHaveBeenCalled()
  })

  it('rethrows unrelated admin profile save errors', async () => {
    const error = new Error('database unavailable')
    mockSaveAdminPublicProfile.mockRejectedValue(error)

    await expect(PUT(
      new NextRequest('http://localhost/api/admin/lodgings/lodging-1/public-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )).rejects.toBe(error)
    expect(mockRevalidatePublicLodgingPaths).not.toHaveBeenCalled()
  })
})
