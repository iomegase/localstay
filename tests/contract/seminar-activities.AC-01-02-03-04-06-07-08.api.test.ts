import { NextRequest } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { uploadGuideImage } from '@/shared/lib/image-upload-service'
import * as queries from '@/features/seminar-activities/queries/admin'
import { GET as listRoute, POST as createRoute } from '@/app/api/admin/seminar-activities/route'
import { DELETE as deleteRoute, PATCH as patchRoute } from '@/app/api/admin/seminar-activities/[id]/route'
import { POST as imageRoute } from '@/app/api/admin/seminar-activities/[id]/image/route'
import { PUT as providersRoute } from '@/app/api/admin/seminar-activities/[id]/providers/route'
import { PUT as placementsRoute } from '@/app/api/admin/seminar-activities/[id]/placements/route'
import { GET as searchRoute } from '@/app/api/admin/seminar-activities/provider-search/route'
import { PUT as orderRoute } from '@/app/api/admin/seminar-activity-placements/order/route'

jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: jest.fn() }))
jest.mock('@/shared/lib/image-upload-service', () => ({ uploadGuideImage: jest.fn() }))
jest.mock('@/features/seminar-activities/queries/admin', () => {
  const actual = jest.requireActual('@/features/seminar-activities/queries/admin')
  return {
    SeminarActivityError: actual.SeminarActivityError,
    SEMINAR_ACTIVITY_ERROR_MESSAGES: actual.SEMINAR_ACTIVITY_ERROR_MESSAGES,
    listSeminarActivitiesForAdmin: jest.fn(),
    createSeminarActivity: jest.fn(),
    updateSeminarActivity: jest.fn(),
    deleteSeminarActivity: jest.fn(),
    setSeminarActivityImage: jest.fn(),
    setSeminarActivityProviders: jest.fn(),
    setSeminarActivityPlacements: jest.fn(),
    reorderSeminarSurface: jest.fn(),
    searchProviderPois: jest.fn(),
  }
})

const q = jest.mocked(queries)
const session = jest.mocked(getSessionAdmin)
const ID = '5188960d-3b52-4b5c-b613-b7cfcf299a79'
const POI = 'c7a0e2d1-2222-4b4b-8d8d-000000000002'
const params = (id = ID) => ({ params: Promise.resolve({ id }) })
const json = (url: string, method: string, body: unknown) => new NextRequest(`http://localhost${url}`, { method, body: typeof body === 'string' ? body : JSON.stringify(body) })
const activity = {
  id: ID, slug: 'rafting', title: 'Rafting', category: 'SUMMER', description: 'Eaux vives', season_label: 'Été', level_label: 'Sportif',
  is_published: false, image_url: null, price_per_person_cents: 4500, price_per_group_cents: null, internal_notes: null, providers: [], placements: [],
} as const
const validCreate = { title: 'Rafting', category: 'SUMMER', description: 'Eaux vives', season_label: 'Été', level_label: 'Sportif', price_per_person_cents: 4500 }

beforeEach(() => {
  jest.resetAllMocks()
  ;(session as jest.Mock).mockResolvedValue({ user: { id: 'admin', role: 'admin' }, error: null })
})

describe('spec 097 AC-02 — authentification et validation', () => {
  const calls: Array<[string, () => Promise<Response>]> = [
    ['GET liste', () => listRoute()],
    ['POST création', () => createRoute(json('/api/admin/seminar-activities', 'POST', validCreate))],
    ['PATCH', () => patchRoute(json('/x', 'PATCH', { title: 'A' }), params())],
    ['DELETE', () => deleteRoute(json('/x', 'DELETE', ''), params())],
    ['PUT prestataires', () => providersRoute(json('/x', 'PUT', { providers: [] }), params())],
    ['PUT attributions', () => placementsRoute(json('/x', 'PUT', { include_hub: true, destination_ids: [] }), params())],
    ['PUT ordre', () => orderRoute(json('/x', 'PUT', { surface_key: 'hub', activity_ids: [] }))],
    ['GET recherche', () => searchRoute(new NextRequest('http://localhost/x?q=esf'))],
  ]

  it.each([401, 403])('refuse une session %i sans écriture', async status => {
    ;(session as jest.Mock).mockResolvedValue({ user: null, error: Response.json({ error: { code: 'FORBIDDEN', message: 'Refusé', details: {} } }, { status }) })
    for (const [, call] of calls) expect((await call()).status).toBe(status)
    for (const mock of Object.values(q)) if (jest.isMockFunction(mock)) expect(mock).not.toHaveBeenCalled()
  })

  it.each([
    ['corps vide', 'broken'],
    ['champ inconnu (is_published à la création)', { ...validCreate, is_published: true }],
    ['catégorie inconnue', { ...validCreate, category: 'SPA' }],
    ['prix négatif', { ...validCreate, price_per_person_cents: -1 }],
    ['prix décimal', { ...validCreate, price_per_group_cents: 10.5 }],
    ['titre vide', { ...validCreate, title: '  ' }],
  ])('création : refuse %s', async (_label, body) => {
    const response = await createRoute(json('/api/admin/seminar-activities', 'POST', body))
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } })
    expect(q.createSeminarActivity).not.toHaveBeenCalled()
  })

  it('refuse un UUID invalide', async () => {
    expect((await patchRoute(json('/x', 'PATCH', { title: 'A' }), params('bad'))).status).toBe(400)
    expect((await providersRoute(json('/x', 'PUT', { providers: [] }), params('bad'))).status).toBe(400)
    expect(q.updateSeminarActivity).not.toHaveBeenCalled()
  })

  it('ne divulgue pas les erreurs internes', async () => {
    q.listSeminarActivitiesForAdmin.mockRejectedValue(new Error('secret database details'))
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const response = await listRoute()
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: { code: 'SEMINAR_ACTIVITY_FAILED', message: 'Opération impossible', details: {} } })
  })
})

describe('spec 097 AC-01 / AC-04 — catalogue', () => {
  it('liste et crée selon le contrat', async () => {
    q.listSeminarActivitiesForAdmin.mockResolvedValue([activity])
    expect(await (await listRoute()).json()).toEqual({ items: [activity] })
    q.createSeminarActivity.mockResolvedValue(activity)
    const response = await createRoute(json('/api/admin/seminar-activities', 'POST', validCreate))
    expect(response.status).toBe(201)
    expect(await response.json()).toEqual(activity)
  })

  it('renvoie SLUG_CONFLICT en 409', async () => {
    q.createSeminarActivity.mockRejectedValue(new queries.SeminarActivityError('SLUG_CONFLICT'))
    const response = await createRoute(json('/api/admin/seminar-activities', 'POST', validCreate))
    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: { code: 'SLUG_CONFLICT', message: 'Une activité porte déjà ce titre', details: {} } })
  })

  it('publication sans image : IMAGE_REQUIRED en 422', async () => {
    q.updateSeminarActivity.mockRejectedValue(new queries.SeminarActivityError('IMAGE_REQUIRED'))
    const response = await patchRoute(json('/x', 'PATCH', { is_published: true }), params())
    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({ error: { code: 'IMAGE_REQUIRED' } })
    expect(q.updateSeminarActivity).toHaveBeenCalledWith(ID, { is_published: true })
  })

  it('suppression douce : 204 puis 404 si absente', async () => {
    expect((await deleteRoute(json('/x', 'DELETE', ''), params())).status).toBe(204)
    q.deleteSeminarActivity.mockRejectedValue(new queries.SeminarActivityError('SEMINAR_ACTIVITY_NOT_FOUND'))
    expect((await deleteRoute(json('/x', 'DELETE', ''), params())).status).toBe(404)
  })
})

describe('spec 097 AC-03 — image', () => {
  function upload(file?: File) {
    const body = new FormData()
    if (file) body.append('file', file)
    return imageRoute(new NextRequest('http://localhost/x', { method: 'POST', body }), params())
  }

  it('téléverse dans seminar-activities/<id> et enregistre l’URL', async () => {
    ;(uploadGuideImage as jest.Mock).mockResolvedValue({ ok: true, url: 'https://cdn/a.webp' })
    q.setSeminarActivityImage.mockResolvedValue({ ...activity, image_url: 'https://cdn/a.webp' })
    const response = await upload(new File(['x'], 'a.heic', { type: 'image/heic' }))
    expect(response.status).toBe(200)
    expect(uploadGuideImage).toHaveBeenCalledWith(expect.any(File), `seminar-activities/${ID}`)
    expect(await response.json()).toEqual({ ...activity, image_url: 'https://cdn/a.webp', url: 'https://cdn/a.webp' })
  })

  it.each([
    ['INVALID_TYPE', 400],
    ['TOO_LARGE', 413],
    ['UPLOAD_FAILED', 500],
  ])('%s → %i sans enregistrement', async (code, status) => {
    ;(uploadGuideImage as jest.Mock).mockResolvedValue({ ok: false, code })
    expect((await upload(new File(['x'], 'a.gif', { type: 'image/gif' }))).status).toBe(status)
    expect(q.setSeminarActivityImage).not.toHaveBeenCalled()
  })

  it('exige un fichier', async () => {
    expect((await upload()).status).toBe(400)
    expect(uploadGuideImage).not.toHaveBeenCalled()
  })
})

describe('spec 097 AC-06 — prestataires', () => {
  it('transmet la liste validée', async () => {
    q.setSeminarActivityProviders.mockResolvedValue(activity)
    const response = await providersRoute(json('/x', 'PUT', { providers: [{ poi_id: POI, notes: ' Contact ' }] }), params())
    expect(response.status).toBe(200)
    expect(q.setSeminarActivityProviders).toHaveBeenCalledWith(ID, { providers: [{ poi_id: POI, notes: 'Contact' }] })
  })

  it('refuse un doublon et renvoie POI_NOT_FOUND en 422', async () => {
    expect((await providersRoute(json('/x', 'PUT', { providers: [{ poi_id: POI }, { poi_id: POI }] }), params())).status).toBe(400)
    q.setSeminarActivityProviders.mockRejectedValue(new queries.SeminarActivityError('POI_NOT_FOUND'))
    expect((await providersRoute(json('/x', 'PUT', { providers: [{ poi_id: POI }] }), params())).status).toBe(422)
  })

  it('recherche : 2 lettres minimum', async () => {
    expect((await searchRoute(new NextRequest('http://localhost/x?q=e'))).status).toBe(400)
    q.searchProviderPois.mockResolvedValue([{ poi_id: POI, poi_name: 'ESF', city_name: 'Saint-Gervais' }])
    expect(await (await searchRoute(new NextRequest('http://localhost/x?q=esf'))).json()).toEqual({ items: [{ poi_id: POI, poi_name: 'ESF', city_name: 'Saint-Gervais' }] })
  })
})

describe('spec 097 AC-07 / AC-08 — attributions et ordre', () => {
  it('attributions : corps strict, destination inconnue en 422', async () => {
    expect((await placementsRoute(json('/x', 'PUT', { destination_ids: [] }), params())).status).toBe(400)
    expect((await placementsRoute(json('/x', 'PUT', { include_hub: true, destination_ids: ['bad'] }), params())).status).toBe(400)
    q.setSeminarActivityPlacements.mockRejectedValue(new queries.SeminarActivityError('DESTINATION_NOT_FOUND'))
    expect((await placementsRoute(json('/x', 'PUT', { include_hub: false, destination_ids: [POI] }), params())).status).toBe(422)
  })

  it('ordre : enregistre puis refuse une liste incohérente', async () => {
    const response = await orderRoute(json('/x', 'PUT', { surface_key: 'hub', activity_ids: [ID] }))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ surface_key: 'hub', activity_ids: [ID] })
    q.reorderSeminarSurface.mockRejectedValue(new queries.SeminarActivityError('PLACEMENT_MISMATCH'))
    expect((await orderRoute(json('/x', 'PUT', { surface_key: 'hub', activity_ids: [] }))).status).toBe(422)
    expect((await orderRoute(json('/x', 'PUT', { surface_key: 'n-importe', activity_ids: [] }))).status).toBe(400)
  })
})
