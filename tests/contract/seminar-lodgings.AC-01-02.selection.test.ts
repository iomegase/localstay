import { PATCH } from '@/app/api/admin/lodgings/[id]/seminar-selection/route'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { setSeminarSelection } from '@/features/lodging-showcase/queries/seminar-lodgings'

jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: jest.fn() }))
jest.mock('@/features/lodging-showcase/queries/seminar-lodgings', () => ({ setSeminarSelection: jest.fn() }))
const id = '5188960d-3b52-4b5c-b613-b7cfcf299a79'
const session = jest.mocked(getSessionAdmin)
const mutation = jest.mocked(setSeminarSelection)
function call(body: string, lodgingId = id) {
  return PATCH(new Request('http://localhost/api/admin/lodgings/selection', { method: 'PATCH', body }), { params: Promise.resolve({ id: lodgingId }) })
}
beforeEach(() => {
  jest.resetAllMocks()
  ;(session as jest.Mock).mockResolvedValue({ user: { id: 'admin', role: 'admin' }, error: null })
})
it.each([true, false])('persists selection %s and returns exactly the API contract', async selected => {
  mutation.mockResolvedValue({ id, seminar_selected: selected })
  const response = await call(JSON.stringify({ seminar_selected: selected }))
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ id, seminar_selected: selected })
  expect(mutation).toHaveBeenCalledWith(id, selected)
})
it.each([401, 403])('rejects unauthorized sessions (%s) without mutation', async status => {
  ;(session as jest.Mock).mockResolvedValue({ user: null, error: Response.json({ error: { code: 'FORBIDDEN', message: 'Refusé', details: {} } }, { status }) })
  expect((await call('{"seminar_selected":true}')).status).toBe(status)
  expect(mutation).not.toHaveBeenCalled()
})
it.each(['{}', '{"seminar_selected":"true"}', '{"seminar_selected":true,"publication_status":"published"}', 'null', 'broken'])('rejects invalid body %s', async body => {
  const response = await call(body)
  expect(response.status).toBe(400)
  expect(await response.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR', details: {} } })
  expect(mutation).not.toHaveBeenCalled()
})
it('rejects invalid UUID', async () => {
  expect((await call('{"seminar_selected":true}', 'bad-id')).status).toBe(400)
  expect(mutation).not.toHaveBeenCalled()
})
it('returns 404 for an absent or deleted lodging', async () => {
  mutation.mockResolvedValue(null)
  const response = await call('{"seminar_selected":true}')
  expect(response.status).toBe(404)
  expect(await response.json()).toMatchObject({ error: { code: 'LODGING_NOT_FOUND' } })
})
it('returns a structured error without leaking database details', async () => {
  mutation.mockRejectedValue(new Error('private database details'))
  const response = await call('{"seminar_selected":true}')
  expect(response.status).toBe(500)
  expect(await response.json()).toEqual({ error: { code: 'SEMINAR_SELECTION_FAILED', message: 'Impossible d’enregistrer la sélection.', details: {} } })
})
