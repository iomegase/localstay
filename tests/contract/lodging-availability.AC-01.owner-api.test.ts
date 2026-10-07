import { NextRequest } from 'next/server'

const mockGetSessionOwner = jest.fn()
const mockSaveOwnerPublicProfile = jest.fn()

jest.mock('@/features/dashboard-owner/lib/get-session-owner', () => ({
  getSessionOwner: () => mockGetSessionOwner(),
}))
jest.mock('@/features/lodging-showcase/queries/owner-public-profile', () => ({
  getOwnerPublicProfile: jest.fn(),
  saveOwnerPublicProfile: (...args: unknown[]) => mockSaveOwnerPublicProfile(...args),
}))

import { PUT } from '@/app/api/dashboard/lodgings/[id]/public-profile/route'

const payload = {
  title: 'Chalet Hygge',
  short_description: 'Un chalet lumineux pour sejourner a Annecy dans l univers MyStay.',
  description: 'Une description suffisamment detaillee pour la fiche publique du logement et son referencement local.',
  property_type: 'Chalet',
  max_guests: 4,
  public_contact_enabled: true,
  photos: [],
  amenities: [],
}

const put = (body: object) => PUT(
  new NextRequest('http://localhost/api/dashboard/lodgings/lodging-1/public-profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }),
  { params: Promise.resolve({ id: 'lodging-1' }) },
)

describe('spec 089 AC-01 — lien iCal du logement (API Owner)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionOwner.mockResolvedValue({ owner: { id: 'owner-1', role: 'owner' }, error: null })
    mockSaveOwnerPublicProfile.mockResolvedValue({ id: 'profile-1', publication_status: 'draft' })
  })

  it('AC-01-01 : enregistre le lien iCal, « https:// » facultatif', async () => {
    const res = await put({ ...payload, availability_ical_url: 'www.airbnb.fr/calendar/ical/123.ics?s=abc' })
    expect(res.status).toBe(200)
    expect(mockSaveOwnerPublicProfile).toHaveBeenCalledWith('owner-1', 'lodging-1', expect.objectContaining({
      availability_ical_url: 'https://www.airbnb.fr/calendar/ical/123.ics?s=abc',
    }))
  })

  it('AC-01-01 : un lien vide le retire', async () => {
    await put({ ...payload, availability_ical_url: '  ' })
    expect(mockSaveOwnerPublicProfile).toHaveBeenCalledWith('owner-1', 'lodging-1', expect.objectContaining({ availability_ical_url: null }))
  })

  it.each([
    'https://localhost/cal.ics',
    'https://127.0.0.1/cal.ics',
    'https://192.168.1.10/cal.ics',
    'https://[::1]/cal.ics',
    'pas un lien',
    'ftp://example.com/cal.ics',
  ])('AC-01-02 : refuse %s avec une erreur sur le champ', async value => {
    const res = await put({ ...payload, availability_ical_url: value })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(json.error.details.fieldErrors.availability_ical_url).toEqual(['Lien de calendrier invalide (lien iCal fourni par la plateforme).'])
    expect(mockSaveOwnerPublicProfile).not.toHaveBeenCalled()
  })
})
