import { NextRequest } from 'next/server'

const mockGetSessionOwner = jest.fn()
const mockGetOwnerPublicProfile = jest.fn()
const mockSaveOwnerPublicProfile = jest.fn()
const mockSubmitOwnerPublicProfile = jest.fn()
const mockSaveSourceListingUrl = jest.fn()
const mockConfirmContentRights = jest.fn()
const mockCreateLodgingPhoto = jest.fn()
const mockUploadGuideImage = jest.fn()
const mockGetRewriteContext = jest.fn()
const mockSaveGeneratedRewrite = jest.fn()
const mockGenerateLodgingRewrite = jest.fn()

jest.mock('@/features/dashboard-owner/lib/get-session-owner', () => ({
  getSessionOwner: () => mockGetSessionOwner(),
}))

jest.mock('@/features/lodging-showcase/queries/owner-public-profile', () => ({
  getOwnerPublicProfile: (...args: unknown[]) => mockGetOwnerPublicProfile(...args),
  saveOwnerPublicProfile: (...args: unknown[]) => mockSaveOwnerPublicProfile(...args),
  submitOwnerPublicProfile: (...args: unknown[]) => mockSubmitOwnerPublicProfile(...args),
  saveSourceListingUrl: (...args: unknown[]) => mockSaveSourceListingUrl(...args),
  confirmContentRights: (...args: unknown[]) => mockConfirmContentRights(...args),
  createLodgingPhoto: (...args: unknown[]) => mockCreateLodgingPhoto(...args),
  getOwnerRewriteContext: (...args: unknown[]) => mockGetRewriteContext(...args),
  saveGeneratedRewrite: (...args: unknown[]) => mockSaveGeneratedRewrite(...args),
}))

jest.mock('@/shared/lib/image-upload-service', () => ({
  uploadGuideImage: (...args: unknown[]) => mockUploadGuideImage(...args),
}))

jest.mock('@/features/lodging-showcase/services/gemini-rewrite', () => ({
  generateLodgingRewrite: (...args: unknown[]) => mockGenerateLodgingRewrite(...args),
}))

import { GET, PUT } from '@/app/api/dashboard/lodgings/[id]/public-profile/route'
import { POST as SUBMIT_POST } from '@/app/api/dashboard/lodgings/[id]/public-profile/submit/route'
import { POST as SOURCE_POST } from '@/app/api/dashboard/lodgings/[id]/public-profile/source-url/route'
import { POST as RIGHTS_POST } from '@/app/api/dashboard/lodgings/[id]/public-profile/rights-confirmation/route'
import { POST as PHOTOS_POST } from '@/app/api/dashboard/lodgings/[id]/public-profile/photos/route'
import { POST as REWRITE_POST } from '@/app/api/dashboard/lodgings/[id]/public-profile/rewrite/route'

const owner = { id: 'owner-1', role: 'owner' }

const savedProfile = {
  id: 'profile-1',
  lodging_id: 'lodging-1',
  city_id: 'city-1',
  slug: 'chalet-hygge',
  publication_status: 'draft',
  title: 'Chalet Hygge',
  short_description: 'Un chalet lumineux pour sejourner a Annecy dans l univers MyStay.',
  description: 'Une description suffisamment detaillee pour la fiche publique du logement et son referencement local.',
  property_type: 'Chalet',
  max_guests: 4,
  bedroom_count: 2,
  bathroom_count: 1,
  bed_count: 3,
  surface_m2: 70,
  public_area_label: 'Annecy-le-Vieux',
  precise_location_public: false,
  public_latitude: null,
  public_longitude: null,
  external_booking_url: 'https://www.airbnb.fr/rooms/123456789',
  external_booking_platform: 'airbnb',
  public_contact_enabled: true,
  source_listing_url: 'https://www.airbnb.fr/rooms/123456789',
  source_listing_platform: 'airbnb',
  source_listing_identifier: '123456789',
  source_metadata_status: 'url_only',
  source_description_text: null,
  content_rights_confirmed_at: null,
  content_rights_confirmed_by_user_id: null,
  content_rights_statement_version: null,
  rewrite_status: 'not_requested',
  rewrite_suggestion: null,
  rewrite_generated_at: null,
  rewrite_provider: null,
  seo_title: 'Chalet Hygge a Annecy | MyStay',
  seo_description: 'Sejournez dans un chalet lumineux a Annecy avec guide local, photos et reservation externe.',
  photos: [],
  amenities: [
    { id: 'amenity-1', code: 'wifi', label: 'Wi-Fi', sort_order: 0 },
    { id: 'amenity-2', code: 'parking', label: 'Parking', sort_order: 1 },
    { id: 'amenity-3', code: 'kitchen', label: 'Cuisine', sort_order: 2 },
  ],
}

const validPayload = {
  title: 'Chalet Hygge',
  short_description: 'Un chalet lumineux pour sejourner a Annecy dans l univers MyStay.',
  description: 'Une description suffisamment detaillee pour la fiche publique du logement et son referencement local.',
  property_type: 'Chalet',
  max_guests: 4,
  bedroom_count: 2,
  bathroom_count: 1,
  bed_count: 3,
  surface_m2: 70,
  public_area_label: 'Annecy-le-Vieux',
  external_booking_url: 'https://www.airbnb.fr/rooms/123456789',
  public_contact_enabled: true,
  seo_title: 'Chalet Hygge a Annecy | MyStay',
  seo_description: 'Sejournez dans un chalet lumineux a Annecy avec guide local, photos et reservation externe.',
  source_description_text: null,
  photos: [],
  amenities: [
    { code: 'wifi', label: 'Wi-Fi', sort_order: 0 },
    { code: 'parking', label: 'Parking', sort_order: 1 },
    { code: 'kitchen', label: 'Cuisine', sort_order: 2 },
  ],
}

function jsonRequest(url: string, method: string, body?: object) {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('028 owner lodging showcase API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionOwner.mockResolvedValue({ owner, error: null })
  })

  it('AC-05-01: returns the owner showcase profile for an owned lodging', async () => {
    mockGetOwnerPublicProfile.mockResolvedValue(savedProfile)

    const res = await GET(
      jsonRequest('http://localhost/api/dashboard/lodgings/lodging-1/public-profile', 'GET'),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(200)
    expect(mockGetOwnerPublicProfile).toHaveBeenCalledWith('owner-1', 'lodging-1')
    await expect(res.json()).resolves.toMatchObject({ id: 'profile-1', publication_status: 'draft' })
  })

  it('AC-05-02: saves owner payload as draft even if a status is submitted', async () => {
    mockSaveOwnerPublicProfile.mockResolvedValue(savedProfile)

    const res = await PUT(
      jsonRequest('http://localhost/api/dashboard/lodgings/lodging-1/public-profile', 'PUT', {
        ...validPayload,
        publication_status: 'published',
      }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(200)
    expect(mockSaveOwnerPublicProfile).toHaveBeenCalledWith(
      'owner-1',
      'lodging-1',
      expect.not.objectContaining({ publication_status: 'published' }),
    )
    await expect(res.json()).resolves.toMatchObject({ publication_status: 'draft' })
  })

  it('AC-05-03: returns 404 when the owner does not own the lodging', async () => {
    mockSaveOwnerPublicProfile.mockResolvedValue(null)

    const res = await PUT(
      jsonRequest('http://localhost/api/dashboard/lodgings/other/public-profile', 'PUT', validPayload),
      { params: Promise.resolve({ id: 'other' }) },
    )

    expect(res.status).toBe(404)
    await expect(res.json()).resolves.toMatchObject({
      error: { code: 'LODGING_NOT_FOUND' },
    })
  })

  it('returns readable validation details when the owner draft payload is invalid', async () => {
    const res = await PUT(
      jsonRequest('http://localhost/api/dashboard/lodgings/lodging-1/public-profile', 'PUT', {
        ...validPayload,
        title: 'abc',
        seo_description: 'trop court',
      }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        details: {
          fieldErrors: {
            title: ['Le titre doit contenir entre 5 et 90 caracteres.'],
            seo_description: ['La meta description doit contenir entre 80 et 180 caracteres.'],
          },
        },
      },
    })
  })

  it('AC-05-04: submits a complete profile for review', async () => {
    mockSubmitOwnerPublicProfile.mockResolvedValue({
      ok: true,
      profile: { id: 'profile-1', publication_status: 'review' },
    })

    const res = await SUBMIT_POST(
      new NextRequest('http://localhost/api/dashboard/lodgings/lodging-1/public-profile/submit', { method: 'POST' }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ id: 'profile-1', publication_status: 'review' })
  })

  it('AC-05-05: refuses review submission when mandatory fields are missing', async () => {
    mockSubmitOwnerPublicProfile.mockResolvedValue({
      ok: false,
      code: 'PROFILE_INCOMPLETE',
      status: 400,
      missingFields: ['content_rights_confirmation', 'photos'],
    })

    const res = await SUBMIT_POST(
      new NextRequest('http://localhost/api/dashboard/lodgings/lodging-1/public-profile/submit', { method: 'POST' }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      error: {
        code: 'PROFILE_INCOMPLETE',
        details: { missingFields: ['content_rights_confirmation', 'photos'] },
      },
    })
  })

  it('AC-05-06: detects Airbnb URL without fetching the platform', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')
    mockSaveSourceListingUrl.mockResolvedValue({
      source_listing_url: 'https://www.airbnb.fr/rooms/123456789',
      source_listing_platform: 'airbnb',
      source_listing_identifier: '123456789',
      source_metadata_status: 'url_only',
    })

    const res = await SOURCE_POST(
      jsonRequest(
        'http://localhost/api/dashboard/lodgings/lodging-1/public-profile/source-url',
        'POST',
        { source_listing_url: 'https://www.airbnb.fr/rooms/123456789' },
      ),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(200)
    expect(fetchSpy).not.toHaveBeenCalled()
    await expect(res.json()).resolves.toMatchObject({
      source_listing_platform: 'airbnb',
      source_listing_identifier: '123456789',
      source_metadata_status: 'url_only',
    })
    fetchSpy.mockRestore()
  })

  it('AC-05-07: rejects invalid external source urls', async () => {
    const res = await SOURCE_POST(
      jsonRequest(
        'http://localhost/api/dashboard/lodgings/lodging-1/public-profile/source-url',
        'POST',
        { source_listing_url: 'http://example.com/listing/1' },
      ),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(400)
    expect(mockSaveSourceListingUrl).not.toHaveBeenCalled()
    await expect(res.json()).resolves.toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    })
  })

  it('AC-05-08: records rights confirmation for imported content', async () => {
    mockConfirmContentRights.mockResolvedValue({
      content_rights_confirmed_at: '2026-06-12T10:00:00.000Z',
    })

    const res = await RIGHTS_POST(
      jsonRequest(
        'http://localhost/api/dashboard/lodgings/lodging-1/public-profile/rights-confirmation',
        'POST',
        { confirmed: true, statement_version: 'v1' },
      ),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      content_rights_confirmed_at: '2026-06-12T10:00:00.000Z',
    })
  })

  it('returns 400 when rights confirmation payload is invalid', async () => {
    const res = await RIGHTS_POST(
      jsonRequest(
        'http://localhost/api/dashboard/lodgings/lodging-1/public-profile/rights-confirmation',
        'POST',
        { confirmed: false, statement_version: '' },
      ),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(400)
    expect(mockConfirmContentRights).not.toHaveBeenCalled()
  })

  it('AC-05-09: rejects unsupported image mime types before storage', async () => {
    const formData = new FormData()
    formData.set('alt', 'Salon principal')
    formData.set('file', new File(['fake'], 'plan.pdf', { type: 'application/pdf' }))

    const res = await PHOTOS_POST(
      new NextRequest('http://localhost/api/dashboard/lodgings/lodging-1/public-profile/photos', {
        method: 'POST',
        body: formData,
      }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(400)
    expect(mockUploadGuideImage).not.toHaveBeenCalled()
    expect(mockCreateLodgingPhoto).not.toHaveBeenCalled()
  })

  it('AC-05-09: uploads a manual photo and creates a LodgingPhoto record', async () => {
    mockUploadGuideImage.mockResolvedValue({
      ok: true,
      url: 'https://cdn.test/guide-photos/lodgings/lodging-1/photo.webp',
    })
    mockCreateLodgingPhoto.mockResolvedValue({
      id: 'photo-1',
      url: 'https://cdn.test/guide-photos/lodgings/lodging-1/photo.webp',
      alt: 'Salon principal',
      room_type: 'common_area',
      sort_order: 0,
      is_cover: true,
    })

    const formData = new FormData()
    formData.set('alt', 'Salon principal')
    formData.set('room_type', 'common_area')
    formData.set('file', new File(['fake-image'], 'salon.webp', { type: 'image/webp' }))

    const res = await PHOTOS_POST(
      new NextRequest('http://localhost/api/dashboard/lodgings/lodging-1/public-profile/photos', {
        method: 'POST',
        body: formData,
      }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(201)
    expect(mockUploadGuideImage).toHaveBeenCalled()
    expect(mockCreateLodgingPhoto).toHaveBeenCalledWith('owner-1', 'lodging-1', {
      url: 'https://cdn.test/guide-photos/lodgings/lodging-1/photo.webp',
      alt: 'Salon principal',
      room_type: 'common_area',
      room_label: null,
    })
    await expect(res.json()).resolves.toMatchObject({
      id: 'photo-1',
      alt: 'Salon principal',
      room_type: 'common_area',
    })
  })

  it('AC-05-09: forwards a per-room room_label to the photo record', async () => {
    mockUploadGuideImage.mockResolvedValue({
      ok: true,
      url: 'https://cdn.test/guide-photos/lodgings/lodging-1/chambre.webp',
    })
    mockCreateLodgingPhoto.mockResolvedValue({
      id: 'photo-2',
      url: 'https://cdn.test/guide-photos/lodgings/lodging-1/chambre.webp',
      alt: 'Chambre parentale',
      room_type: 'bedroom',
      room_label: 'Chambre 2',
      sort_order: 1,
      is_cover: false,
    })

    const formData = new FormData()
    formData.set('alt', 'Chambre parentale')
    formData.set('room_type', 'bedroom')
    formData.set('room_label', 'Chambre 2')
    formData.set('file', new File(['fake-image'], 'chambre.webp', { type: 'image/webp' }))

    const res = await PHOTOS_POST(
      new NextRequest('http://localhost/api/dashboard/lodgings/lodging-1/public-profile/photos', {
        method: 'POST',
        body: formData,
      }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(201)
    expect(mockCreateLodgingPhoto).toHaveBeenCalledWith('owner-1', 'lodging-1', {
      url: 'https://cdn.test/guide-photos/lodgings/lodging-1/chambre.webp',
      alt: 'Chambre parentale',
      room_type: 'bedroom',
      room_label: 'Chambre 2',
    })
  })

  it('AC-05-10: creates a MyStay rewrite draft from owner source text', async () => {
    mockGetRewriteContext.mockResolvedValue({
      cityName: 'Annecy',
      maxGuests: 4,
      amenities: ['Wi-Fi', 'Parking', 'Cuisine'],
    })
    mockGenerateLodgingRewrite.mockResolvedValue({
      short_description: 'Chalet lumineux a Annecy avec guide local MyStay et ambiance chaleureuse.',
      description: 'Une version longue reecrite pour le SEO local et la mise en valeur premium du logement MyStay a Annecy.',
      seo_title: 'Chalet lumineux a Annecy | MyStay',
      seo_description: 'Sejournez a Annecy dans un chalet lumineux avec ambiance locale, equipements essentiels et guide MyStay.',
    })
    mockSaveGeneratedRewrite.mockResolvedValue({
      rewrite_status: 'generated',
      rewrite_suggestion: '{"short_description":"Chalet lumineux a Annecy avec guide local MyStay et ambiance chaleureuse.","description":"Une version longue reecrite pour le SEO local et la mise en valeur premium du logement MyStay a Annecy.","seo_title":"Chalet lumineux a Annecy | MyStay","seo_description":"Sejournez a Annecy dans un chalet lumineux avec ambiance locale, equipements essentiels et guide MyStay."}',
    })

    const res = await REWRITE_POST(
      jsonRequest(
        'http://localhost/api/dashboard/lodgings/lodging-1/public-profile/rewrite',
        'POST',
        {
          source_description_text: 'Texte source Owner suffisamment long pour permettre une reecriture editoriale MyStay locale et premium sur Annecy.',
        },
      ),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      rewrite_status: 'generated',
    })
  })

  it('AC-05-12: returns 503 when Gemini rewrite is unavailable', async () => {
    mockGetRewriteContext.mockResolvedValue({
      cityName: 'Annecy',
      maxGuests: 4,
      amenities: ['Wi-Fi'],
    })
    mockGenerateLodgingRewrite.mockRejectedValue(new Error('GEMINI_API_KEY not set'))

    const res = await REWRITE_POST(
      jsonRequest(
        'http://localhost/api/dashboard/lodgings/lodging-1/public-profile/rewrite',
        'POST',
        {
          source_description_text: 'Texte source Owner suffisamment long pour permettre une reecriture editoriale MyStay locale et premium sur Annecy.',
        },
      ),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(503)
    await expect(res.json()).resolves.toMatchObject({
      error: { code: 'GEMINI_REWRITE_UNAVAILABLE' },
    })
  })
})
