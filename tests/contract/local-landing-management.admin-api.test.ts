import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockListDestinations = jest.fn()
const mockListEligibleCities = jest.fn()
const mockCreate = jest.fn()
const mockUpdate = jest.fn()
const mockDelete = jest.fn()
const mockSetActive = jest.fn()
const mockRevalidatePath = jest.fn()

jest.mock('next/cache', () => ({ revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args) }))
jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockGetSessionAdmin() }))
jest.mock('@/features/local-seo/queries/landing-pages', () => ({
  LandingDestinationError: class LandingDestinationError extends Error {
    constructor(
      public readonly code: 'NOT_FOUND' | 'DESTINATION_ALREADY_EXISTS' | 'INCOMPLETE_CONTENT',
      public readonly status: 400 | 404 | 409,
      public readonly details: Record<string, unknown> = {},
    ) {
      super(code)
    }
  },
  listAdminLandingDestinations: () => mockListDestinations(),
  listEligibleLandingCities: () => mockListEligibleCities(),
  createLandingDestination: (...args: unknown[]) => mockCreate(...args),
  updateLandingDestinationPages: (...args: unknown[]) => mockUpdate(...args),
  deleteLandingDestination: (...args: unknown[]) => mockDelete(...args),
  setLandingDestinationActive: (...args: unknown[]) => mockSetActive(...args),
}))

import { LandingDestinationError } from '@/features/local-seo/queries/landing-pages'
import { GET, POST } from '@/app/api/admin/landing-pages/route'
import { DELETE, PATCH as patchDestination } from '@/app/api/admin/landing-pages/[id]/route'
import { PATCH as patchPublication } from '@/app/api/admin/landing-pages/[id]/publication/route'

const destinationId = 'a80e52ea-371b-46a1-9d56-c124157254bd'
const citySlug = 'saint-gervais-les-bains'
const validDestination = { id: destinationId, city: { id: 'city-1', name: 'Saint-Gervais-les-Bains', slug: citySlug } }
const page = (intent: 'CONCIERGE' | 'SEMINAR' | 'VACATION_RENTAL') => ({
  intent,
  seo_title: 'Titre SEO valide', meta_description: 'Description SEO valide', eyebrow: 'Surtitre', h1: 'Titre H1 valide',
  hero_title: 'Titre hero valide', hero_copy: 'Texte hero suffisamment long', reassurance: null,
  section_title: 'Titre section valide', section_copy: 'Texte section suffisamment long', process_title: 'Notre méthode locale',
  local_title: 'Titre local valide', local_copy: 'Texte local suffisamment long', cta_label: 'Nous contacter', cta_href: '/contact',
  empty_copy: intent === 'VACATION_RENTAL' ? 'Aucun logement public disponible actuellement.' : null,
  highlights: intent === 'VACATION_RENTAL' ? [] : [{ title: 'Point fort', copy: 'Description suffisamment longue' }],
  steps: intent === 'VACATION_RENTAL' ? [] : [{ title: 'Étape locale', copy: 'Description suffisamment longue' }],
  faq: intent === 'VACATION_RENTAL' ? [] : [{ question: 'Question locale ?', answer: 'Réponse suffisamment longue.' }],
})
const validPages = ['CONCIERGE', 'SEMINAR', 'VACATION_RENTAL'].map(intent => page(intent as 'CONCIERGE' | 'SEMINAR' | 'VACATION_RENTAL'))

function context(id = destinationId) {
  return { params: Promise.resolve({ id }) }
}

function expectRevalidation(slug = citySlug) {
  expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/landing-pages')
  expect(mockRevalidatePath).toHaveBeenCalledWith('/sitemap.xml')
  expect(mockRevalidatePath).toHaveBeenCalledWith(`/conciergerie/${slug}`, 'page')
  expect(mockRevalidatePath).toHaveBeenCalledWith(`/seminaires/${slug}`, 'page')
  expect(mockRevalidatePath).toHaveBeenCalledWith(`/locations-vacances/${slug}`, 'page')
  expect(mockRevalidatePath).toHaveBeenCalledWith('/confier-mon-logement', 'page')
  expect(mockRevalidatePath).toHaveBeenCalledWith('/seminaires', 'page')
  expect(mockRevalidatePath).toHaveBeenCalledWith('/logements', 'page')
}

describe('048 landing management admin API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin' }, error: null })
  })

  it('preserves a non-admin 403 without listing destinations', async () => {
    const error = Response.json({ error: { code: 'FORBIDDEN', message: 'Accès refusé', details: {} } }, { status: 403 })
    mockGetSessionAdmin.mockResolvedValue({ user: null, error })

    expect((await GET()).status).toBe(403)
    expect(mockListDestinations).not.toHaveBeenCalled()
    expect(mockListEligibleCities).not.toHaveBeenCalled()
  })

  it('short-circuits every mutation for a denied admin session', async () => {
    mockGetSessionAdmin.mockImplementation(() => ({
      user: null,
      error: Response.json({ error: { code: 'FORBIDDEN', message: 'Accès refusé', details: {} } }, { status: 403 }),
    }))

    const post = await POST(new NextRequest('http://localhost/api/admin/landing-pages', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ city_id: 'city-1' }),
    }))
    const update = await patchDestination(new NextRequest(`http://localhost/api/admin/landing-pages/${destinationId}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pages: validPages }),
    }), context())
    const remove = await DELETE(new NextRequest(`http://localhost/api/admin/landing-pages/${destinationId}`, { method: 'DELETE' }), context())
    const publication = await patchPublication(new NextRequest(`http://localhost/api/admin/landing-pages/${destinationId}/publication`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ is_active: true }),
    }), context())

    for (const response of [post, update, remove, publication]) {
      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({ error: { code: 'FORBIDDEN', message: 'Accès refusé', details: {} } })
    }
    expect(mockCreate).not.toHaveBeenCalled()
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(mockDelete).not.toHaveBeenCalled()
    expect(mockSetActive).not.toHaveBeenCalled()
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })

  it('returns the collection contract with destinations and eligible cities only', async () => {
    mockListDestinations.mockResolvedValue([validDestination])
    mockListEligibleCities.mockResolvedValue([{ id: 'city-2', name: 'Megève', slug: 'megeve' }])

    const response = await GET()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      destinations: [validDestination],
      eligible_cities: [{ id: 'city-2', name: 'Megève', slug: 'megeve' }],
    })
  })

  it('creates a destination and revalidates every affected surface', async () => {
    mockCreate.mockResolvedValue(validDestination)
    const request = new NextRequest('http://localhost/api/admin/landing-pages', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ city_id: 'city-1' }),
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual(validDestination)
    expect(mockCreate).toHaveBeenCalledWith('city-1')
    expectRevalidation()
  })

  it('returns a structured 409 when the city already has a destination', async () => {
    mockCreate.mockRejectedValue(new LandingDestinationError('DESTINATION_ALREADY_EXISTS', 409))
    const response = await POST(new NextRequest('http://localhost/api/admin/landing-pages', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ city_id: 'city-1' }),
    }))

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({
      error: { code: 'DESTINATION_ALREADY_EXISTS', message: 'Cette ville possède déjà une configuration.', details: {} },
    })
  })

  it('returns a structured validation error for invalid JSON and invalid UUIDs', async () => {
    const invalidJson = await POST(new NextRequest('http://localhost/api/admin/landing-pages', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{',
    }))
    const invalidId = await patchDestination(new NextRequest('http://localhost/api/admin/landing-pages/not-a-uuid', {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pages: validPages }),
    }), context('not-a-uuid'))

    expect(invalidJson.status).toBe(400)
    expect(await invalidJson.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR', message: 'Paramètre manquant ou invalide' } })
    expect(invalidId.status).toBe(400)
    expect(await invalidId.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR', message: 'Paramètre manquant ou invalide' } })
  })

  it('updates all three pages and revalidates every affected surface', async () => {
    mockUpdate.mockResolvedValue(validDestination)
    const response = await patchDestination(new NextRequest(`http://localhost/api/admin/landing-pages/${destinationId}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pages: validPages }),
    }), context())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(validDestination)
    expect(mockUpdate).toHaveBeenCalledWith(destinationId, validPages)
    expectRevalidation()
  })

  it('returns a structured 404 when a destination update is unknown', async () => {
    mockUpdate.mockRejectedValue(new LandingDestinationError('NOT_FOUND', 404))
    const response = await patchDestination(new NextRequest(`http://localhost/api/admin/landing-pages/${destinationId}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pages: validPages }),
    }), context())

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Destination introuvable', details: {} } })
  })

  it('soft-deletes a destination while returning only the public deletion contract', async () => {
    mockDelete.mockResolvedValue({ id: destinationId, city_slug: citySlug })
    const response = await DELETE(new NextRequest(`http://localhost/api/admin/landing-pages/${destinationId}`, { method: 'DELETE' }), context())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ id: destinationId })
    expect(mockDelete).toHaveBeenCalledWith(destinationId)
    expectRevalidation()
  })

  it('toggles publication and revalidates every affected surface', async () => {
    mockSetActive.mockResolvedValue(validDestination)
    const response = await patchPublication(new NextRequest(`http://localhost/api/admin/landing-pages/${destinationId}/publication`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ is_active: true }),
    }), context())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(validDestination)
    expect(mockSetActive).toHaveBeenCalledWith(destinationId, true)
    expectRevalidation()
  })

  it('preserves incomplete content details and the required French publication message', async () => {
    const repositoryDetails = {
      missingFields: ['CONCIERGE.h1', 'SEMINAR.faq'],
      issues: [
        { intent: 'CONCIERGE', field: 'h1', message: 'Required' },
        { intent: 'SEMINAR', field: 'faq', message: 'Required' },
      ],
    }
    mockSetActive.mockRejectedValue(new LandingDestinationError('INCOMPLETE_CONTENT', 400, repositoryDetails))
    const response = await patchPublication(new NextRequest(`http://localhost/api/admin/landing-pages/${destinationId}/publication`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ is_active: true }),
    }), context())

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: {
        code: 'INCOMPLETE_CONTENT',
        message: 'Les contenus obligatoires doivent être complétés avant activation.',
        details: { CONCIERGE: ['h1'], SEMINAR: ['faq'] },
      },
    })
  })

  it('hides unexpected errors behind the structured 500 contract', async () => {
    mockListDestinations.mockRejectedValue(new Error('database credentials leaked'))
    mockListEligibleCities.mockResolvedValue([])

    const response = await GET()

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Erreur interne', details: {} } })
  })
})
